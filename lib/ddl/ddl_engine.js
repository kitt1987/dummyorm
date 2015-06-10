'use strict'

var async = require('async');
var _ = require('lodash');
var util = require('util');

exports = module.exports = function(engine) {
	this.engine = engine;
}

exports.prototype.performSQL = function(sql, cb) {
	this.engine.performSQL(sql, cb);
}

function _describeColumn(columnObj) {
	if (!columnObj.name)
		throw new Error('The column name is requisite');
	if (!columnObj.type)
		throw new Error('The column type is requisite');

	var columnDef = '';
	if (columnObj.len) {
		columnDef = util.format('%s %s(%d)', columnObj.name, columnObj.type.sql, columnObj.len);
	} else {
		columnDef = util.format('%s %s', columnObj.name, columnObj.type.sql);
	}

	if (columnObj.primary)
		columnDef += ' PRIMARY KEY ';
	if (columnObj.notNull)
		columnDef += ' NOT NULL ';
	return columnDef;
}

function _createTable(createObj, schema, acb) {
	if (!createObj.table)
		throw new Error('Table name is requisite');
	if (createObj.column.length == 0)
		throw new Error('You should define 1 column at least');

	var columns = _.map(createObj.column, _describeColumn).join(',');
	var sql = util.format('CREATE TABLE %s(%s)', column.name, columns);
	this.engine.performSQL(sql, function(err) {
		acb(err, schema);
	});
}

function _addColumns(addColumnObj, schema, acb) {
	if (addColumnObj.length == 0)
		throw new Error('You should define 1 column at least');

	var columns = _.map(addColumnObj, function(column) {
		var columnDef = _describeColumn(columnObj);
		return util.format('ADD COLUMN %s', columnDef);
	}).join(',');

	var sql = util.format('ALTER TABLE %s %s', schema.tableName, columns);
	this.engine.performSQL(sql, function(err) {
		acb(err, schema);
	});
}

function _modifyColumns(modifyObj, schema, acb) {
	if (modifyObj.length == 0)
		throw new Error('You should define 1 column at least');

	var columns = _.map(modifyObj, function(column) {
		var columnDef = _describeColumn(columnObj);
		return util.format('MODIFY COLUMN %s', columnDef);
	}).join(',');

	var sql = util.format('ALTER TABLE %s %s', schema.tableName, columns);
	this.engine.performSQL(sql, function(err) {
		acb(err, schema);
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
		acb(err, schema);
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
		columnDef = util.format('ADD INDEX %s %s (%s)', indexObj.name, indexObj.type, indexObj.column.join(','));
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
		acb(err, schema);
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
		acb(err, schema);
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

	var seq = [];
	seq.push(function(acb) {
		acb(null, schema);
	});

	if (create) {
		seq.push(_createTable.bind(this, create));
	}

	if (add)
		seq.push(_addColumns.bind(this, add));

	if (modify)
		seq.push(_modifyColumns.bind(this, modify));

	if (drop)
		seq.push(_dropColumns.bind(this, drop));

	if (addIndex)
		seq.push(_addIndicies.bind(this, addIndex));

	if (dropIndex)
		seq.push(_dropIndices.bind(this, dropIndex));

	if (seq.length == 1)
		cb(null, schema);

	async.waterfall(seq, cb);
}