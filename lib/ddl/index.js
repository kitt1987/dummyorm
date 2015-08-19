'use strict'

var Schema = require('../schema');
var datatype = require('./datatype');
var _ = require('lodash');

exports = module.exports = {};

exports.define = function(tableName, properties, options) {
	var defaultColumn = [{
		name: datatype.UpdateTsField,
		type: datatype.BigInteger,
		notNull: true
	}, {
		name: datatype.IDField,
		type: datatype.Integer,
		primary: true
	}];
	var schema = new Schema(tableName, _.flattenDeep([defaultColumn, properties]),
		options);
	this.schemas.push(schema);
	this[schema.tableName] = schema;
	return schema;
}

// Deprecated
exports.defineManyToMany = function(schemaA, schemaB) {
	var schema = this.define(schemaA.tableName + 'M2M' + schemaB.tableName,
		[], schemaA.options);
	schema.referTo(schemaA);
	schema.referTo(schemaB);
	this.schemas.push(schema);
	this[schema.tableName] = schema;
	return schema;
}
