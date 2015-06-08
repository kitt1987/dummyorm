'use strict'

var _ = require('lodash');
var async = require('async');
var Record = require('./record').Record;
var Query = require('./query');

exports = module.exports = function(tableName, properties, orm) {
	// new id column
	// build to DDL
	this.tableName = tableName;
	if (!this.tableName)
		throw Error('You should set table name');

	this.properties = properties;
	if (!this.properties)
		throw Error('You should set properties for schema');

	this.orm = orm;
	if (!this.orm)
		throw Error('Engines is requisite for schema');
}

exports.prototype.set = function(options) {
	// for reference key
}

exports.prototype.sync = function(cb) {
	cb();
}

exports.prototype.buildIndex = function(columns, cb) {
	cb();
}

exports.prototype.create = function(properties) {
	return new Record(this, properties);
}

exports.prototype.save = function(record, cb) {
	var waterfall_cbs = []
	async.each(this.engines, function(engine, cb) {
		waterfall_cbs.push(engine.__proto__.create.bind(engine));
		cb();
	}, function(err) {
		if (err) {
			cb(err, null);
			return;
		}
	});

	async.waterfall(waterfall_cbs, function(err, result) {
		cb(err, result);
	});
}

exports.prototype.query = function() {
	return new Query(this);
}

exports.prototype.execQuery = function(query, cb) {
	if (query._topLevel) {
		this.engines[this.engines.length - 1].query(query, cb);
		return;
	}

	if (query._bottomLevel) {
		this.engines[0].query(query, cb);
		return;
	}

	async.some(this.engines, function(engine, async_cb) {
			engine.query(query, function(err, objs) {
				async_cb(!err && objs);
				if (objs)
					cb(null, objs);
			})
		},
		function(r) {
			if (!r)
				cb();
		});
}

exports.prototype.drop = function(cb) {
	async.each(this.engines, function(engine, async_cb) {
		engine.drop(this, async_cb);
	}.bind(this), function(err) {
		cb(err);
	});
}

exports.prototype.dropRecord = function( /* id, cb */ ) {
	if (arguments.length < 1)
		throw Error('Too few arguments');

	var cb, id;
	if (arguments.length < 2) {
		cb = arguments[0];
		if (typeof cb !== 'function')
			throw Error('You should set at least 1 callback');
	} else {
		id = arguments[0];
		cb = arguments[1];
	}

	async.each(this.engines, function(engine, async_cb) {
		if (id) {
			engine.delete_(this, id, async_cb);
		} else {
			engine.deleteAll(this, async_cb);
		}
	}.bind(this), function(err) {
		cb(err);
	});
}