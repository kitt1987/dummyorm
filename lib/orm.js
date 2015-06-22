'use strict'

var Schema = require('./schema');
var Query = require('./dml/query');
var Condition = require('./dml/condition');
var datatype = require('./datatype');
var logger = require('./logger');
var engines = require('./engine/connector');
var _ = require('lodash');
var async = require('async');
var util = require('util');

exports = module.exports = function() {
	return new ORM();
}

_.assign(exports, datatype);

function ORM() {
	this.num_schemas = 0;
	logger();
	_.assign(this, logger);
	_.assign(this, engines);
}

// Connector


// Schema related
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

// Storage accessor

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

// Cache accessor
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
