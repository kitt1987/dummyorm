'use strict'

exports = module.exports = function(schema) {
	this.schema = schema;
}

exports.prototype.id = function(id) {
	this._id = id;
}

exports.prototype.where = function(condition) {
	this._where = where;
	return this;
}

exports.prototype.offset = function(offset) {
	this._offset = offset;
	return this;
}

exports.prototype.limit = function(limit) {
	this._limit = limit;
	return this;
}

exports.prototype.groupBy = function(column) {
	this._group = column;
	return this;
}

exports.prototype.orderBy = function(column) {
	this._order = column;
	return this;
}

exports.prototype.topLevelOnly = function() {
	this._topLevel = true;
	return this;
}

exports.prototype.bottomLevelOnly = function() {
	this._bottomLevel = true;
	return this;
}

exports.prototype.exec = function(cb) {
	this.schema.execQuery(this, cb);
}