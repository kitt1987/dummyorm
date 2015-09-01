'use strict';

var MemCached = require('memcached');
var _ = require('lodash');

exports = module.exports = function(props) {
	this.objLifeTime = 0; // (In seconds) Never expire
	if (props.liveConn) {
		this.memcached = props.liveConn;
	} else {
		this.memcached = new MemCached(props.server, props.privacy);
	}

	if (props.objLifeTime)
		this.objLifeTime = props.objLifeTime;
};

exports.prototype.disconnect = function(cb) {
	this.memcached.end();
	cb();
};

exports.prototype.keep = function(key, value, cb, lifeTime) {
	if (_.isUndefined(lifeTime))
		lifeTime = this.objLifeTime;

	this.memcached.set(key, value, lifeTime, cb);
};

exports.prototype.get = function(key, cb) {
	if (_.isArray(key)) {
		this.memcached.getMulti(key, cb);
		return;
	}

	this.memcached.get(key, cb);
};

exports.prototype.del = function(key, cb) {
	this.memcached.del(key, cb);
};

exports.prototype.flush = function(cb) {
	this.memcached.flush(cb);
};

exports.prototype.gets = function(key, cb) {
	this.memcached.gets(key, cb);
};

exports.prototype.cas = function(key, value, cas, cb, lifeTime) {
	if (_.isUndefined(lifeTime))
		lifeTime = this.objLifeTime;

	this.memcached.cas(key, value, cas, lifeTime, cb);
};

exports.prototype.append = function(key, value, cb) {
	this.memcached.append(key, value, cb);
};

exports.prototype.prepend = function(key, value, cb) {
	this.memcached.prepend(key, value, cb);
};
