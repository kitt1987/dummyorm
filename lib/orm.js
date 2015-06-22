'use strict'

var Schema = require('./schema');
var MemCache = require('./engine/memcached');
var Redis = require('./engine/redis');
var Mysql = require('./engine/mysql');
var StepLoader = require('./ddl/step_loader');
var Query = require('./dml/query');
var Condition = require('./dml/condition');
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

ORM.prototype.useMemoryCached = function(properties) {
	if (this.cache)
		throw new Error('Cache has defined');

	this.cache = new MemCache(properties);
}

ORM.prototype.useRedisCache = function(properties) {
	if (this.cache)
		throw new Error('Cache has defined');
	this.cache = new Redis(properties);
}

ORM.prototype.cacheEnabled = function() {
	return !!this.cache;
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

ORM.prototype.enableFileLog = function(logFile, logLevel) {
	winston.add(winston.transports.File, {
		filename: logFile,
		level: logLevel
	});
}

ORM.prototype.enableCliLog = function() {
	winston.add(winston.transports.Console);
}

ORM.IDField = 'id';
ORM.UpdateTsField = 'update_ts';

ORM.prototype.define = function(table_name, properties) {
	var defaultColumn = [{
		name: ORM.UpdateTsField,
		type: datatype.BigInteger,
		notNull: true
	}, {
		name: ORM.IDField,
		type: datatype.Integer,
		primary: true
	}];
	++this.num_schemas;
	return new Schema(table_name, _.flattenDeep([defaultColumn, properties]));
}

function _updateCache(key, record, cb) {
	this.cache.get(key, function(err, result) {
		if (err) {
			cb(err);
			return;
		}

		if (result && result[ORM.UpdateTsField] >= record[ORM.UpdateTsField]) {
			cb();
			return;
		}

		this.cache.keep(key, record.dump(), cb);
	}.bind(this));
}

ORM.prototype.save = function(key, record, cb) {
	record[ORM.UpdateTsField] = _.now();
	var self = this;
	this.storage.insert(record, function(err) {
		if (err) {
			cb(err);
			return;
		}

		if (self.cache) {
			_updateCache.bind(self)(key, record, cb);
		} else {
			cb();
		}
	});
}

ORM.prototype.update = function(key, record, cb) {
	record[ORM.UpdateTsField] = _.now();
	var self = this;
	this.storage.update(record, function(err) {
		if (err) {
			cb(err);
			return;
		}

		if (self.cache) {
			_updateCache.bind(self)(key, record, cb);
		} else {
			cb();
		}
	});
}

ORM.prototype.del = function(key, record, cb) {
	var self = this;
	this.storage.del(record, function(err) {
		if (self.cache) {
			self.cache.del(key, cb);
		} else {
			cb();
		}
	});
}

ORM.prototype.keep = function(key, record, cb) {
	if (!this.cache)
		throw new Error('Cache is inactive');
	this.cache.keep(key, record.dump(), cb);
}

ORM.prototype.get = function(key, cb) {
	if (!this.cache) {
		cb(new Error('Cache is inactive'));
		return;
	}
	this.cache.get(key, cb);
}

ORM.prototype.remove = function(key, cb) {
	if (!this.cache) {
		cb(new Error('Cache is inactive'));
		return;
	}

	this.cache.del(key, cb);
}

ORM.prototype.condition = function() {
	return new Condition;
}

ORM.prototype.query = function(schema) {
	if (schema) {
		return new Query(this.storage, schema.tableName);
	} else {
		return new Query(this.storage);
	}
}
