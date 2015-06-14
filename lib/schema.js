'use strict'

var _ = require('lodash');
var async = require('async');
var Record = require('./record').Record;
var Query = require('./query');

exports = module.exports = function(tableName, properties) {
	if (!tableName)
		throw Error('You should set table name');

	this.tableName = tableName;
	this.pending = {};
	_createTable.bind(this)(tableName, _arrayfy(properties));
}

function _arrayfy(properties) {
	return _.isArray(properties) ? properties : [properties];
}

function _defineColumn(column) {
	if (this[column.name])
		throw new Error('Duplicate columns');
	this[column.name] = column;
}

function _modifyColumn(column) {
	if (!this[column.name])
		throw new Error('No column');
	this[column.name] = column;
}

function _createTable(tableName, columns) {
	this.pending['create'] = this.pending['create'] || {};
	this.pending['create'].table = this.tableName;
	this.pending['create'].column = columns;
	_.map(this.pending['create'].column, _defineColumn.bind(this));
}

exports.prototype.addColumn = function(columnProperties) {
	var columns = _arrayfy(columnProperties);
	this.pending['add'] = this.pending['add'] || [];
	this.pending['add'] = this.pending['add'].concat(columns);
	_defineColumn.bind(this)(columns);
}

exports.prototype.dropColumn = function(columnName) {
	var columns = _arrayfy(columnName);
	this.pending['drop'] = this.pending['drop'] || [];
	this.pending['drop'] = this.pending['drop'].concat(columns);
}

exports.prototype.modifyColumn = function(columnProperties) {
	var columns = _arrayfy(columnProperties);
	this.pending['modify'] = this.pending['modify'] || [];
	this.pending['modify'] = this.pending['modify'].concat(columns);
	_modifyColumn.bind(this)(columns);
}

exports.prototype.buildIndex = function(indexProperties) {
	var indecies = _arrayfy(indexProperties);
	this.pending['addIndex'] = this.pending['addIndex'] || [];
	this.pending['addIndex'] = this.pending['addIndex'].concat(indecies);
}

exports.prototype.dropIndex = function(indexName) {
	var indecies = _arrayfy(indexName);
	this.pending['dropIndex'] = this.pending['dropIndex'] || [];
	this.pending['dropIndex'] = this.pending['dropIndex'].concat(indecies);
}

exports.prototype.contains = function(schema) {
	exports.prototype.addColumn.bind(this, {
		name: schema.tableName + '_id',
		referTo: schema
	})();
}

exports.prototype.getPending = function() {
	var pending = this.pending;
	this.pending = {};
	return pending;
}

exports.prototype.set = function(options) {
	// for reference key
}

exports.prototype.sync = function(cb) {
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