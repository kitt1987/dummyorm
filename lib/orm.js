'use strict'

var Schema = require('./schema').Schema;
var Engines = require('./engine');

exports = module.exports = function() {
	return new ORM();
}

function ORM() {
	this.engines = [];
	this.num_schemas = 0;
}

ORM.prototype.setEngine = function(property) {
	if (!property.name || property.name.length === 0)
		throw Error('Engine name is requisite');

	if (this.num_schemas > 0)
		throw Error('You have defined some schemas');

	var Engine = Engines[property.name];
	if (!Engine)
		throw Error('Engine ' + property.name + ' is not supported');

	this.engines.push(new Engine(property));
	return this;
}

ORM.prototype.define = function(/* table_name, properties, options, callback */) {
	if (arguments.length < 3) {
		throw Error('Too few arguments');
	}

	++this.num_schemas;
	return new Schema(arguments, engines);
}