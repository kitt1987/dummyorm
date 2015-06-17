'use strict'

var _ = require('lodash');

exports = module.exports = function(properties) {
	// FIXME set memory limit
}

exports.prototype.disconnect = function(cb) {
	cb();
}

exports.prototype.keep = function(key, value, cb) {
	this[key] = value;
	cb();
}

exports.prototype.get = function(key, cb) {
	cb(null, this[key]);
}

exports.prototype.del = function(key, cb) {
	if (this[key])
		delete this[key];
	cb()
}