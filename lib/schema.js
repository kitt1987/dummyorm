'use strict'

var _ = require('lodash');
var async = require('async');
var Record = require('./record').Record;

exports = module.exports = {}
exports.Schema = Schema;

function Schema(/* args or ORM.define, engines */) {
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
	this.engines.sync(this, cb);
}

Schema.prototype.buildIndex = function(columns, cb) {
	// Build DDL
}

Schema.prototype.create = function(properties) {
	return new Record(this, properties);
}

Schema.prototype.save = function(record, cb) {

}

Schema.prototype.query = function(/* conditions, options, cb */) {

}

Schema.prototype.drop = function(cb) {

}

Schema.prototype.dropRecord = function(/* id, cb */) {

}