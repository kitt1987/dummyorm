'use strict'

var _ = require('lodash');
var util = require('../util');

exports = module.exports = function(properties) {
	// FIXME set memory limit
}

exports.prototype.disconnect = function(cb) {
	cb();
}

exports.prototype.sync = function(schema, cb) {
	cb();
}

exports.prototype.buildIndex = function(schema, columns, cb) {
	cb();
}

exports.prototype.create = function(record, cb) {
	var id = util.calcObjectKey(record.schema, record.id);
	this[id] = record;
	cb(null, record);
}

exports.prototype.delete_ = function(schema, id, cb) {
	var id = util.calcObjectKey(record.schema, record.id);
	this.delete(id);
	cb();
}

exports.prototype.deleteAll = function(schema, cb) {
	_.forOwn(this, function(k, v) {
		this.delete[k];
	}.bind(this));
	cb();
}

exports.prototype.query = function(query, cb) {
	if (!query._id) {
		cb();
		return;
	}

	var id = util.calcObjectKey(query.schema, query._id);
	cb(null, this[id]);
}