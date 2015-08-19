'use strict'

var _ = require('lodash');

exports = module.exports = {};

exports.toArray = function(obj) {
	return _.isArray(obj) ? obj : [obj];
};

exports.applyCacheKey = function(key, record) {
	if (typeof key === 'function') {
		if (_.isUndefined(record))
			throw new Error('Undefined argument to a function cache key:' + key);

		return key(record);
	}

	return key;
};
