'use strict';

var _ = require('lodash');
var util = require('util');

exports = module.exports = function(engine, main_table) {
	this.engine = engine;
	this._select = '*';
	this._table = main_table;
};

// Disable querying partial record
// exports.prototype.select = function(/* multiple columns */) {
// 	var sel = [], tables = [];
// 	_.forIn(arguments, function(c) {
// 		sel.push(c.schema.tableName + '.' + c.name);
// 		tables.push(c.schema.tableName);
// 	});

// 	this._select = sel.join(',');
// 	this._table = _.uniq(tables).join(',');
// 	return this;
// }

exports.prototype.where = function(condition) {
	this._where = condition;
	return this;
};

exports.prototype.offset = function(offset) {
	this._offset = offset;
	return this;
};

exports.prototype.limit = function(limit) {
	this._limit = limit;
	return this;
};

exports.prototype.groupBy = function(column) {
	this._group = column.schema.tableName + '.' + column.name;
	return this;
};

exports.prototype.orderBy = function(column) {
	this._order = column.schema.tableName + '.' + column.name;
	return this;
};

exports.prototype.desc = function() {
	this._desc = true;
	return this;
}

exports.prototype.exec = function(cb) {
	if (!this._select) {
		cb(new Error('You should set columns want to query'));
		return;
	}

	if (!this._table) {
		cb(new Error('You should set table want to query'));
		return;
	}

	var sql = util.format('SELECT %s FROM %s', this._select, this._table.join(','));
	if (this._where)
		sql += ' WHERE ' + this._where;

	if (this._group)
		sql += ' GROUP BY ' + this._group;

	if (this._order)
		sql += ' ORDER BY ' + this._order;

	if (this._desc)
		sql += ' DESC ';

	if (this._limit)
		sql += ' LIMIT ' + this._limit;

	if (this._offset)
		sql += ' OFFSET ' + this._offset;

	this.engine.performSQL(sql, cb);
};