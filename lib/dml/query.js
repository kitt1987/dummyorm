'use strict';

var _ = require('lodash');
var Join = require('./join');
var util = require('util');

exports = module.exports = Query;

function Query(engine, main_table) {
	this.engine = engine;
	this._select = '*';
	if (main_table)
		this._table = _.uniq(main_table).join(',');
}

Query.prototype.select = function( /* multiple columns */ ) {
	if (arguments.length === 1 && typeof arguments[0] === 'string') {
		this._select = arguments[0];
		return this;
	}

	var sel = [],
		tables = [];
	_.forIn(arguments, function(c) {
		sel.push(c.schema.tableName + '.' + c.name);
		tables.push(c.schema.tableName);
	});

	this._select = sel.join(',');
	this._table = _.uniq(tables).join(',');
	return this;
}

Query.prototype.function = function(func) {
	this._select = func;
}

Join.makeJoinable(Query.prototype);

Query.prototype.where = function(condition) {
	this._where = condition;
	return this;
};

Query.prototype.offset = function(offset) {
	this._offset = offset;
	return this;
};

Query.prototype.limit = function(limit) {
	this._limit = limit;
	return this;
};

Query.prototype.groupBy = function(column) {
	this._group = column.schema.tableName + '.' + column.name;
	return this;
};

Query.prototype.orderBy = function(column) {
	this._order = column.schema.tableName + '.' + column.name;
	return this;
};

Query.prototype.desc = function() {
	this._desc = true;
	return this;
}

Query.prototype.exec = function(cb) {
	if (!this._select || !this._table) {
		cb(new Error('You should call orm.query(Schema) or orm.query().select(Schema.Column)'));
		return;
	}

	var sql = util.format('SELECT %s FROM %s', this._select, this._table);
	if (this._join) {
		sql += ' ' + this._join;
	}

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