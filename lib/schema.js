'use strict'

var _ = require('lodash');
var async = require('async');
var Record = require('./record').Record;
var Query = require('./query');
var orm = require('./orm');

exports = module.exports = function(tableName, properties) {
	// new id column
	// build to DDL
	this.tableName = tableName;
	if (!this.tableName)
		throw Error('You should set table name');

	_.forIn(properties, exports.prototype.addColumn.bind(this));
	this.pending = {};
	_createTable.bind(this)();
}

function _createTable() {
	this.pending['create'] = {
		table: this.tableName,
		column: [{
			name: 'id',
			type: orm.Integer,
			primary: true
		}, {
			name: 'update_ts',
			type: orm.Integer,
			notNull: true
		}]
	};
}

exports.prototype.addColumn = function(columnProperties) {
	var addPending = this.pending['add'] = this.pending['add'] || [];
	addPending.push(columnProperties);
}

exports.prototype.dropColumn = function(columnName) {
	var dropPending = this.pending['drop'] = this.pending['drop'] || [];
	dropPending.push(columnName);
}

exports.prototype.modifyColumn = function(columnProperties) {
	var modifyPending = this.pending['modify'] = this.pending['modify'] || [];
	modifyPending.push(columnProperties);
}

exports.prototype.buildIndex = function(indexProperties) {
	var addIndexPending = this.pending['addIndex'] = this.pending['addIndex'] || [];
	addIndexPending.push(indexProperties);
}

exports.prototype.dropIndex = function(indexName) {
	var dropIndexPending = this.pending['dropIndex'] = this.pending['dropIndex'] || [];
	dropIndexPending.push(indexName);
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