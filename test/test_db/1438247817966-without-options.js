'use strict';
var orm = require('ormcache.js');
exports = module.exports = {};
exports.lastStep = '1435485152524-many-to-many.js';
exports.run = function(ormcache, done) {
	var NoOptions = ormcache.define('NoOptions', {
		name: 'NoOp',
		type: orm.String,
		len: 1,
	});

	done();
};
