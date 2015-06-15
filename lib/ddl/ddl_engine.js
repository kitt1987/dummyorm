'use strict'

var async = require('async');
var _ = require('lodash');
var util = require('util');
var logger = require('winston');
var colors = require('colors');
var datatype = require('../datatype');

exports = module.exports = function(engine) {
	this.engine = engine;
	this.ddlTable = '_ormcache_ddl';
	this.stepColumn = 'step_ts';
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

	if (columnObj.type.js == 'number' && columnObj.unsigned)
		columnDef += ' UNSIGNED';

	if (columnObj.primary) {
		columnDef += ' PRIMARY KEY';
		columnObj.autoInc = true;
		columnObj.notNull = true;
	}

	if (columnObj.notNull)
		columnDef += ' NOT NULL';
	if (columnObj.autoInc)
		columnDef += ' AUTO_INCREMENT';
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

function _updateSyncStep(step, cb) {
	var up = 'UPDATE ' + this.ddlTable + ' SET ' + this.stepColumn +
		'=' + step + ';';
	this.engine.performSQL(up, function(err, result) {
		if (err) {
			logger.error(colors.red('Fail to update DDL table due to ' + err));
		}

		cb(err);
	});
}

exports.prototype.syncSchema = function(step, schema, cb) {
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

	seq.push(_updateSyncStep.bind(this, step));
	async.waterfall(seq, cb);
}

function _checkDB(db, cb) {
	var dbCreation = 'CREATE DATABASE IF NOT EXISTS ' + db + ';';
	this.engine.performSQL(dbCreation, function(err, result) {
		if (err) {
			logger.error(colors.red('Fail to create database[' +
				db + '] due to ' + err));
		} else {
			logger.info(colors.green('database[' + db + '] is created'));
		}
		cb(err);
	});
}

function _switchDB(db, cb) {
	this.engine.useDB(db);
	logger.info(colors.green('Switch to database[' + db + ']'));
	cb();
}

function _checkDDLTable(cb) {
	var ddlCreation = 'CREATE TABLE IF NOT EXISTS ' +
		this.ddlTable + '(id INT PRIMARY KEY AUTO_INCREMENT, ' + this.stepColumn +
		' BIGINT NOT NULL) ENGINE=InnoDB;'
	this.engine.performSQL(ddlCreation, function(err, result) {
		if (err) {
			logger.error(colors.red('Fail to create DDL table due to ' + err));
		} else {
			logger.info(colors.green('DDL table is created'));
		}

		cb(err);
	});
}

function _findSyncStep(cb) {
	var queryStep = 'SELECT ' + this.stepColumn + ' FROM ' + this.ddlTable + ';';
	this.engine.performSQL(queryStep, function(err, result) {
		if (err) {
			logger.error(colors.red('Fail to load the last step due to ' + err));
			cb(err);
			return;
		}

		if (result.length > 1) {
			logger.error(colors.red('Malformed database'));
			cb(new Error('Malformed database'));
			return;
		}

		if (result.length == 1) {
			logger.info(colors.green('The last step is ' + result[0][this.stepColumn]));
			cb(err, result[0][this.stepColumn]);
			return;
		}

		this.engine.performSQL('INSERT INTO ' + this.ddlTable +
			'(' + this.stepColumn + ') VALUES(0);',
			function(err, result) {
				cb(err, 0);
			});
	}.bind(this));
}

exports.prototype.switchDB = function(db, cb) {
	var swDB = [
		_checkDB.bind(this, db),
		_switchDB.bind(this, db),
		_checkDDLTable.bind(this),
		_findSyncStep.bind(this)
	];
	async.waterfall(swDB, cb);
}

exports.prototype.currentStep = function(cb) {
	_findSyncStep.bind(this)(cb);
}