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
	return new Schema(tableName, _.flattenDeep([defaultColumn, properties]),
		options);
}