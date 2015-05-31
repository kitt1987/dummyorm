'use strict'

var _ = require('lodash');
var async = require('async');
var Record = require('./record').Record;
var Query = require('./engine/query').Query;

exports = module.exports = {}
exports.Schema = Schema;

function Schema( /* args or ORM.define, engines */ ) {
	var args = _.flattenDeep(arguments);
	if (args.length < 3)
		throw Error('Too few arguments');

	// table_name, properties, options(optional), callback and engines
	this.table_name = args[0];
	if (!this.table_name)
		throw Error('You should set a table name for schema');

	// new id column
	// build to DDL
	this.properties = args[1];
	if (!this.properties)
		throw Error('You should set properties for schema');

	this.engines = args[2];
	if (!this.engines)
		throw Error('Engines is requisite for schema');
}

Schema.prototype.set = function(options) {
	// for reference key
}

Schema.prototype.sync = function(cb) {
	async.each(this.engines, function(engine, async_cb) {
		engine.sync(this, async_cb);
	}.bind(this), function(err) {
		cb(err);
	});
}

Schema.prototype.buildIndex = function(columns, cb) {
	async.each(this.engines, function(engine, async_cb) {
		engine.buildIndex(this, columns, async_cb);
	}.bind(this), function(err) {
		cb(err);
	});
}

Schema.prototype.create = function(properties) {
	return new Record(this, properties);
}

Schema.prototype.save = function(record, cb) {
	waterfall_cbs = []
	this.engines.forEach(function(elem, index, engines) {
		waterfall_cbs.push(function(record, async_cb) {
			elem.create(record, async_cb);
		});
	});

	async.waterfall(waterfall_cbs, function(err, result) {
		cb(err, result);
	});
}

Schema.prototype.query = function() {
	return new Query(this);
}

Schema.prototype.execQuery = function(query, cb) {
	if (query._topLevel) {
		this.engines[this.engines.length - 1]..query(query, cb);
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

Schema.prototype.drop = function(cb) {
	async.each(this.engines, function(engine, async_cb) {
		engine.drop(this, async_cb);
	}.bind(this), function(err) {
		cb(err);
	});
}

Schema.prototype.dropRecord = function( /* id, cb */ ) {
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