'use strict'

var Query = require('./query');
var Condition = require('./condition');
var ddl = require('../ddl/datatype');
var _ = require('lodash');

exports = module.exports = {};

function _updateCache(key, record, cb) {
	this.cache.get(key, function(err, result) {
		if (err) {
			cb(err);
			return;
		}

		if (result && result[ddl.UpdateTsField] >= record[ddl.UpdateTsField]) {
			cb();
			return;
		}

		this.cache.keep(key, record.dump(), cb);
	}.bind(this));
}

exports.save = function(key, record, cb) {
	record[ddl.UpdateTsField] = _.now();
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

exports.update = function(key, record, cb) {
	record[ddl.UpdateTsField] = _.now();
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

exports.del = function(key, record, cb) {
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
exports.keep = function(key, record, cb) {
	if (!this.cache)
		throw new Error('Cache is inactive');
	this.cache.keep(key, record.dump(), cb);
}

exports.get = function(key, cb) {
	if (!this.cache) {
		cb(new Error('Cache is inactive'));
		return;
	}
	this.cache.get(key, cb);
}

exports.remove = function(key, cb) {
	if (!this.cache) {
		cb(new Error('Cache is inactive'));
		return;
	}

	this.cache.del(key, cb);
}

exports.condition = function() {
	return new Condition;
}

exports.query = function(schema) {
	if (schema) {
		return new Query(this.storage, schema.tableName);
	} else {
		return new Query(this.storage);
	}
}