'use strict'

var MemCache = require('./memcached');
var Redis = require('./redis');
var Mysql = require('./mysql');
var StepLoader = require('../ddl/step_loader');
var _ = require('lodash');
var async = require('async');

exports = module.exports = {}

exports.useMemoryCached = function(properties) {
	if (this.cache)
		throw new Error('Cache has defined');

	this.cache = new MemCache(properties);
}

exports.useRedisCache = function(properties) {
	if (this.cache)
		throw new Error('Cache has defined');
	this.cache = new Redis(properties);
}

exports.cacheEnabled = function() {
	return !!this.cache;
}

exports.useMysql = function(properties, cb) {
	if (this.storage)
		throw new Error('Storage has defined');
	this.storage = new Mysql(properties);
	this.storage.connect(function(err) {
		if (err) {
			cb(err);
			return;
		}

		StepLoader.bind(this)(this.storage);
		_.assign(this, StepLoader);
		cb();
	}.bind(this));
}

exports.disconnect = function(cb) {
	var conn = [];
	if (this.cache)
		conn.push(this.cache);
	if (this.storage)
		conn.push(this.storage);

	if (conn.length === 0) {
		cb();
		return;
	}

	async.each(conn, function(engine, async_cb) {
		if (engine)
			engine.disconnect(async_cb);
	}, function(err) {
		cb(err);
	});
}