'use strict'
var orm = require('../..');
exports = module.exports = {}
exports.lastStep = '';
exports.run = function(ormcache, done) {
	var User = ormcache.define('User', [{
		name: 'uid',
		type: orm.String,
		len: 36,
		notNull: true
	}, {
		name: 'pw',
		type: orm.String,
		len: 36,
		notNull: true
	}], {
		engine: 'Memory'
	});

	done();
}