'use strict'

var async = require('async');
var util = require('util');

exports = module.exports = function(engine) {
	this.engine = engine;
}

exports.prototype.performSQL = function(sql, cb) {
	this.engine.performSQL(sql, cb);
}

function _createTable(createObj, schema, acb) {
	if (!createObj.table)
		throw new Error('Table name is requisite');
	if (createObj.column.length == 0)
		throw new Error('You should define 1 column at least');

	var columns = '';
	_.forIn(createObj.column, function(column) {
		if (!column.name)
			throw new Error('The column name is requisite');
		if (!column.type)
			throw new Error('The column type is requisite');

		var columnDef = '';
		if (column.len) {
			columnDef = util.format('%s %s(%d)', column.name, column.type.sql, column.len);
		} else {
			columnDef = util.format('%s %s', column.name, column.type.sql);
		}

		if (column.primary)
			columnDef = columnDef + ' PRIMARY KEY ';
		if (column.notNull)
			columnDef = columnDef + ' NOT NULL ';
		columnDef = columnDef + ',';
	});

	var sql = util.format('CREATE TABLE %s(%s)', column.name, columns.slice(0, columns.length - 1));
	this.engine.performSQL(sql, function(err) {
		acb(err, schema);
	});
}

function _addColumns(addColumnObj, schema, acb) {

}

function _modifyColumns(modifyObj, schema, acb) {

}

function _dropColumns(dropColumnObj, schema, acb) {

}

function _addIndices(addIndexObj, schema, acb) {

}

function _dropIndices(dropIndexObj, schema, acb) {

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
		seq.push(_addIndices.bind(this, addIndex));

	if (dropIndex)
		seq.push(_dropIndices.bind(this, dropIndex));

	if (seq.length == 1)
		cb(null, schema);

	async.waterfall(seq, cb);
}