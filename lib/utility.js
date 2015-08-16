'use strict'

var _ = require('lodash');

exports = module.exports = {};

exports.toArray = function(obj) {
	return _.isArray(obj) ? obj : [obj];
};
