'use strict'

var _ = require('lodash');

exports = module.exports = {};

exports.arrayWrapped = function(obj) {
	return _.isArray(obj) ? obj : [obj];
}