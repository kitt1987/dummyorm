'use strict';
var orm = require('ormcache.js');
exports = module.exports = {};
exports.lastStep = '';
exports.run = function(ormcache, done) {

	// FIXME create or modify schema here and call done() to save changes.
	// You could access each schema by calling ormcache[schemaTalbeName].
	ormcache.define('benchData', [{
		name: 'textData',
		type: orm.String,
		len: 200
	}, {
		name: 'integerData',
		type: orm.Integer
	}], {
		engine: 'Memory'
	})

	done();
};
