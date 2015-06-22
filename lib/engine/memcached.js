'use strict'

var MemCached = require('memcached');

exports = module.exports = function(properties) {
	this.memcached = new MemCached(properties.server, properties.privacy);
	this.objLifeTime = 0; // (In seconds) Never expire
}

exports.prototype.disconnect = function(cb) {
	this.memcached.end();
	cb();
}

exports.prototype.keep = function(key, value, cb) {
	this.memcached.set(key, value, this.objLifeTime, cb);
}

exports.prototype.get = function(key, cb) {
	this.memcached.get(key, cb);
}

exports.prototype.del = function(key, cb) {
	this.memcached.del(key, cb);
}