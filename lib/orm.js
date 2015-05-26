'use strict'

var Schema = require('./schema').Schema;

exports = module.exports = function() {
	return new ORM();
}

function ORM() {
	this.engines = []
}

ORM.prototype.setEngine = function(engine) {

	return this;
}

ORM.prototype.define = function(/* table_name, properties, options, callback */) {
	if (arguments.length < 3) {
		throw Error('Too few arguments');
	}

	return new Schema(arguments);
}