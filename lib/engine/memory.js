'use strict'

var _ = require('lodash');
var util = require('./util');

exports = module.exports = {
	engine: Memory
}

function Memory(properties) {

}

Memory.prototype.connect = function(cb) {
	cb();
}

Memory.prototype.sync = function(schema, cb) {
	cb();
}

Memory.prototype.buildIndex = function(schema, columns, cb) {
	cb();
}

Memory.prototype.create = function(record, cb) {
	var id = util.calcObjectKey(record.schema, record.id);
	this[id] = record;
	cb(null, record);
}

Memory.prototype.delete_ = function(schema, id, cb) {
	var id = util.calcObjectKey(record.schema, record.id);	
	this.delete(id);
	cb();
}

Memory.prototype.deleteAll = function(schema, cb) {
	_.forOwn(this, function(k, v) {
		this.delete[k];
	}.bind(this));
	cb();
}