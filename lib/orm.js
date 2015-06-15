'use strict'

var Schema = require('./schema');
var MemCache = require('./engine/memory');
var Redis = require('./engine/redis');
var Mysql = require('./engine/mysql');
var StepLoader = require('./ddl/step_loader');
var datatype = require('./datatype');
var _ = require('lodash');
var async = require('async');
var util = require('util');
var winston = require('winston');

exports = module.exports = function() {
	return new ORM();
}

_.assign(exports, datatype);

function ORM() {
	this.num_schemas = 0;
	winston.remove(winston.transports.Console);
}

ORM.prototype.useMemoryCache = function(properties) {
	if (this.cache)
		throw new Error('Cache has defined');
	this.cache = new MemCache(properties);
}

ORM.prototype.useRedisCache = function(properties, cb) {
	if (this.cache)
		throw new Error('Cache has defined');
	this.cache = new Redis(properties);
	this.cache.connect(cb);
}

ORM.prototype.useMysql = function(properties, cb) {
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

ORM.prototype.disconnect = function(cb) {
	async.each([this.cache, this.storage], function(engine, async_cb) {
		if (engine)
			engine.disconnect(async_cb);
	}, function(err) {
		cb(err);
	});
}

ORM.prototype.enableFileLog = function(logFile, logLevel) {
	winston.add(winston.transports.File, {
		filename: logFile,
		level: logLevel
	});
}

ORM.prototype.enableCliLog = function() {
	winston.add(winston.transports.Console);
}

ORM.prototype.define = function(table_name, properties) {
	var defaultColumn = [{
		name: 'update_ts',
		type: datatype.Integer,
		notNull: true
	}, {
		name: 'id',
		type: datatype.Integer,
		primary: true
	}];
	++this.num_schemas;
	return new Schema(table_name, _.flattenDeep([defaultColumn, properties]));
}