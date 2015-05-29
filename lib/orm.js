'use strict'

var Schema = require('./schema').Schema;
var Engines = require('./engine');
var async = require('async');

exports = module.exports = function() {
	return new ORM();
}

function ORM() {
	this.engines = [];
	this.max_level = 2;
	this.num_schemas = 0;
}

ORM.prototype.setEngine = function(property) {
	if (!property.id)
		throw Error('Engine id is requisite');

	if (this.num_schemas > 0)
		throw Error('You have defined some schemas');

	if (this.engines.length >= this.max_level)
		throw Error('Levels should not be more than ' + this.max_level);

	var Engine = Engines[property.id];
	if (!Engine)
		throw Error('Engine ' + property.id + ' is not supported');

	this.engines.push(new Engine(property));
	return this;
}

ORM.prototype.connect = function(cb) {
	async.each(this.engines, function(engine, async_cb) {
		engine.connect(async_cb);
	}, function(err) {
		cb(err);
	});
}

ORM.prototype.define = function(/* table_name, properties */) {
	if (arguments.length < 2) {
		throw Error('Too few arguments');
	}

	++this.num_schemas;
	return new Schema(arguments, engines);
}
