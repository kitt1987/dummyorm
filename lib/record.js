'use strict'

var _ = require('lodash');
var util = require('util');

exports = module.exports = function(schema, properties) {
	this.schema = schema;
	_.forOwn(properties, _defineField.bind(this));
}

function _defineField(fieldValue, fieldKey) {
	if (!_.has(this.schema, fieldKey)) {
		throw new Error('No such column in schema ' +
			util.inspect(this.schema) + ', which column is ' + fieldKey);
	}

	if (typeof fieldValue != this.schema[fieldKey].type.js) {
		throw new Error('Data types are mismatched in schema ' +
			util.inspect(this.schema) + ', which value type is ' +
			typeof fieldValue);
	}

	if (this[fieldKey]) {
		throw new Error('Duplicated fields ' + fieldKey + '=' + fieldValue +
			' in ' + util.inspect(properties))
	}

	this[fieldKey] = fieldValue;
}

exports.prototype.set = function(properties) {
	_.forOwn(properties, _defineField.bind(this));
}

exports.prototype.drop = function(fields) {

}