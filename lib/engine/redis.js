'use strict'

var Redis = require('ioredis');

exports = module.exports = function(properties) {
	this.redis = new Redis(properties);
}

exports.prototype.disconnect = function(cb) {
	this.redis.disconnect();
	cb();
}

exports.prototype.keep = function(key, value, cb) {
	this.redis.set(key, value);
	cb();
}

exports.prototype.get = function(key, cb) {
	this.redis.get(key, cb);
}

exports.prototype.del = function(key, cb) {
	this.redis.del(key);
	cb();
}