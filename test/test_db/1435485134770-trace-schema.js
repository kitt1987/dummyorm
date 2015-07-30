'use strict';
var orm = require('ormcache.js');
exports = module.exports = {};
exports.lastStep = '1435482913491-add-foreign-key.js';
exports.run = function(ormcache, done) {
	var Trace = ormcache.define('Trace', {
		name: 'trace',
		type: orm.String,
		len: 255,
		notNull: true
	}, {
		engine: 'Memory'
	});

	done();
};