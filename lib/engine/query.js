'use strict'

exports = module.exports = {}
exports.Query = Query;

function Query(schema) {
	this.schema = schema;
}

Query.prototype.id = function(id) {
	this._id = id;
}

Query.prototype.where = function(condition) {
	this._where = where;
	return this;
}

Query.prototype.offset = function(offset) {
	this._offset = offset;
	return this;
}

Query.prototype.limit = function(limit) {
	this._limit = limit;
	return this;
}

Query.prototype.groupBy = function(column) {
	this._group = column;
	return this;
}

Query.prototype.orderBy = function(column) {
	this._order = column;
	return this;
}

Query.prototype.topLevelOnly = function() {
	this._topLevel = true;
	return this;
}

Query.prototype.bottomLevelOnly = function() {
	this._bottomLevel = true;
	return this;
}

Query.prototype.exec = function(cb) {
	this.schema.execQuery(this, cb);
}