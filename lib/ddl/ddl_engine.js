'use strict'

var async = require('async');
var _ = require('lodash');
var util = require('util');
var datatype = require('../datatype');

exports = module.exports = function(engine) {
	this.engine = engine;
}

exports.prototype.performSQL = function(sql, cb) {
	this.engine.performSQL(sql, cb);
}

function _describeColumn(columnObj) {
	if (!columnObj.name)
		throw new Error('The column name is requisite ' + util.inspect(columnObj));
	if (!columnObj.type && !columnObj.referTo)
		throw new Error('The column type is requisite ' + util.inspect(columnObj));

	var columnDef = '';
	if (columnObj.len) {
		columnDef = util.format('%s %s(%d)', columnObj.name, columnObj.type.sql, columnObj.len);
	} else {
		columnDef = util.format('%s %s', columnObj.name, columnObj.type.sql);
	}

	if (columnObj.primary) {
		columnDef += ' PRIMARY KEY ';
		columnObj.autoInc = true;
		columnObj.notNull = true;
	}

	if (columnObj.notNull)
		columnDef += ' NOT NULL ';
	if (columnObj.autoInc)
		columnDef += ' AUTO_INCREMENT ';
	return columnDef;
}

function _createTable(createObj, schema, acb) {
	if (!createObj.table)
		throw new Error('Table name is requisite');
	if (createObj.column.length == 0)
		throw new Error('You should define 1 column at least');

	var columns = _.map(createObj.column, _describeColumn).join(',');
	var sql = util.format('CREATE TABLE IF NOT EXISTS %s(%s) ENGINE=InnoDB;',
		createObj.table, columns);
	this.engine.performSQL(sql, function(err) {
		acb(err);
	});
}

function _addColumns(addColumnObj, schema, acb) {
	if (addColumnObj.length == 0)
		throw new Error('You should define 1 column at least');

	var columns = _.map(addColumnObj, function(column) {
		var columnDef = _describeColumn(column);
		return util.format('ADD COLUMN %s', columnDef);
	}).join(',');

	var sql = util.format('ALTER TABLE %s %s', schema.tableName, columns);
	this.engine.performSQL(sql, function(err) {
		acb(err);
	});
}

function _modifyColumns(modifyObj, schema, acb) {
	if (modifyObj.length == 0)
		throw new Error('You should define 1 column at least');

	var columns = _.map(modifyObj, function(column) {
		var columnDef = _describeColumn(column);
		return util.format('MODIFY COLUMN %s', columnDef);
	}).join(',');

	var sql = util.format('ALTER TABLE %s %s', schema.tableName, columns);
	this.engine.performSQL(sql, function(err) {
		acb(err);
	});
}

function _dropColumns(dropColumnObj, schema, acb) {
	if (dropColumnObj.length == 0)
		throw new Error('You should define 1 column at least');

	var columns = _.map(dropColumnObj, function(column) {
		return util.format('DROP COLUMN %s,', column);
	}).join(',');

	var sql = util.format('ALTER TABLE %s %s', schema.tableName, columns);
	this.engine.performSQL(sql, function(err) {
		acb(err);
	});
}

function _describeIndex(indexObj) {
	if (!indexObj.name)
		throw new Error('Index name is requisite');
	if (indexObj.column.length == 0)
		throw new Error(util.format('You should define 1 column for index %s at least',
			indexObj.name));
	var columnDef = '';
	if (indexObj.type) {
		columnDef = util.format('ADD INDEX %s %s (%s)', indexObj.name, indexObj.type.sql,
			_.map(indexObj.column, function(column) {
				return column.name;
			}).join(','));
	} else {
		columnDef = util.format('ADD INDEX %s (%s)', indexObj.name, indexObj.column.join(','));
	}

	return columnDef;
}

function _addIndicies(addIndexObj, schema, acb) {
	if (addIndexObj.length == 0)
		throw new Error('You should define 1 index at least');
	var indecies = _.map(addIndexObj, _describeIndex).join(',');
	var sql = util.format('ALTER TABLE %s %s', schema.tableName, indecies);
	this.engine.performSQL(sql, function(err) {
		acb(err);
	});
}

function _dropIndices(dropIndexObj, schema, acb) {
	if (addIndexObj.length == 0)
		throw new Error('You should drop 1 index at least');
	var indecies = _.map(addIndexObj, function(index) {
		return util.format('DROP INDEX %s', index);
	}).join(',');

	var sql = util.format('ALTER TABLE %s %s', schema.tableName, indecies);
	this.engine.performSQL(sql, function(err) {
		acb(err);
	});
}

function _describeAddForeignKey(fkObj) {
	var column = {
		name: fkObj.tableName + '_id',
		type: datatype.Integer
	}

	var cDef = _describeColumn(column);
	var fkDef = util.format('CONSTRAINT %s FOREIGN KEY (%s) REFERENCES %s(%s)',
		'fk_' + column.name, column.name, fkObj.tableName, fkObj.id.name);
	return 'ADD COLUMN ' + cDef + ',ADD ' + fkDef;
}

function _addForeignKey(fkObjs, schema, acb) {
	if (fkObjs.length == 0)
		throw new Error('You should define 1 foreign key at least');

	var fks = _.map(fkObjs, _describeAddForeignKey).join(',');
	var sql = util.format('ALTER TABLE %s %s', schema.tableName, fks);
	this.engine.performSQL(sql, function(err) {
		acb(err);
	});
}

function _describeDropForeignKey(fkObj) {
	var cName = fkObj.tableName + '_id';
	return util.format('DROP FOREIGN KEY %s, DROP COLUMN %s', 'fk_' + cName, cName);
}

function _dropForeignKey(fkObjs, schema, acb) {
	if (fkObjs.length == 0)
		throw new Error('You should define 1 foreign key at least');

	var fks = _.map(fkObjs, _describeDropForeignKey).join(',');
	var sql = util.format('ALTER TABLE %s %s', schema.tableName, fks);
	this.engine.performSQL(sql, function(err) {
		acb(err);
	});
}

exports.prototype.syncSchema = function(schema, cb) {
	var pending = schema.getPending();
	var create = pending.create;
	var add = pending.add
	var modify = pending.modify;
	var drop = pending.drop;
	var addIndex = pending.addIndex;
	var dropIndex = pending.dropIndex;
	var addFK = pending.addFK;
	var dropFK = pending.dropFK;

	var seq = [];

	if (create) {
		seq.push(_createTable.bind(this, create, schema));
	}

	if (add)
		seq.push(_addColumns.bind(this, add, schema));

	if (modify)
		seq.push(_modifyColumns.bind(this, modify, schema));

	if (drop)
		seq.push(_dropColumns.bind(this, drop, schema));

	if (addIndex)
		seq.push(_addIndicies.bind(this, addIndex, schema));

	if (dropIndex)
		seq.push(_dropIndices.bind(this, dropIndex, schema));

	if (addFK)
		seq.push(_addForeignKey.bind(this, addFK, schema));

	if (dropFK)
		seq.push(_dropForeignKey.bind(this, dropFK, schema));

	async.waterfall(seq, cb);
}

exports.prototype.switchDB = function(db, cb) {
	var use = 'USE ' + db + ';';
	this.performSQL(use, function(err, result) {
		if (!err) {
			this.engine.useDB(db);
		}
		cb(err);
	}.bind(this));
}