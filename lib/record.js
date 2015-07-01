'use strict'

var _ = require('lodash');
var util = require('util');
var datatype = require('./ddl/datatype');

exports = module.exports = function(schema, properties) {
	this.schema = schema;
	_.forOwn(properties, _defineField.bind(this));
}

function _defineField(fieldValue, fieldKey) {
	if (fieldValue == null) {
		return;
	}

	if (!_.has(this.schema, fieldKey)) {
		throw new Error('No such column in schema ' +
			util.inspect(this.schema) + ', which column is ' + fieldKey);
	}

	if (this.schema[fieldKey].type === datatype.ForeignKey) {
		if (!(fieldValue instanceof exports) && typeof fieldValue !== 'number') {
			throw new Error('The value assigned to a foreign key must be a record or integer');
		}
	} else if (typeof fieldValue != this.schema[fieldKey].type.js) {
		throw new Error('Data types are mismatched in schema ' +
			util.inspect(this.schema) + ', which value type is ' +
			typeof fieldValue);
	}

	this[fieldKey] = fieldValue;
}

exports.prototype.set = function(properties) {
	_.forOwn(properties, _defineField.bind(this));
}

exports.prototype.drop = function(fields) {
	_.forIn(fields, function(field) {
		if (!this[field])
			throw new Error('The column you want to drop is not exist, which is ' + field);
		this.delete(field);
	});
}

exports.prototype.getPending = function() {
	var fields = _.filter(_.keys(this), function(k) {
		return k != 'schema' && typeof this[k] != 'function'
	}.bind(this));

	var pending = {};
	_.forIn(fields, function(k) {
		if (this.schema[k].type === datatype.ForeignKey && typeof this[k] !== 'number') {
			pending[k] = this[k].id;
			return;
		}

		switch (this.schema[k].type.js) {
			case 'string':
				pending[k] = '\'' + this[k] + '\'';
				break;

			case 'boolean':
				pending[k] = this[k] ? 1 : 0;
				break;

			default:
				pending[k] = this[k];
				break;
		}
	}.bind(this));
	return pending;
}

exports.prototype.getValue = function() {
	var pending = {};
	_.forIn(this, function(v, k) {
		if (k != 'schema' && typeof this[k] != 'function') {
			if (this.schema[k].type === datatype.ForeignKey && typeof v !== 'number') {
				pending[k] = v.id;
			} else {
				pending[k] = v;
			}
		}
	}.bind(this));

	return pending;
}

exports.prototype.dump = function() {
	return JSON.stringify(this.getValue());
}