'use strict'

var Condition = require('./condition');

exports = module.exports = function(engine) {
	this.engine = engine;
}

exports.condition = function() {
	return new Condition;
}

exports.prototype.select = function() {

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

exports.prototype.exec = function(cb) {
	this.engine.performSQL(this, cb);
}