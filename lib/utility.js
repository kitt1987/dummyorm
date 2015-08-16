'use strict'

var _ = require('lodash');

exports = module.exports = {};

exports.toArray = function(obj) {
	return _.isArray(obj) ? obj : [obj];
};

exports.fkColumn = function(schema) {
	return 'refer_to_' + schema.tableName;
};

exports.fkKey = function(tableName, referred) {
	return 'fk_' + tableName + '_' + referred.tableName;
}
