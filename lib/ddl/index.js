'use strict'

var Schema = require('../schema');
var datatype = require('./datatype');
var _ = require('lodash');

exports = module.exports = {};

exports.define = function(table_name, properties) {
	var defaultColumn = [{
		name: datatype.UpdateTsField,
		type: datatype.BigInteger,
		notNull: true
	}, {
		name: datatype.IDField,
		type: datatype.Integer,
		primary: true
	}];
	return new Schema(table_name, _.flattenDeep([defaultColumn, properties]));
}