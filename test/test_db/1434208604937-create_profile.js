'use strict'
var orm = require('../..');
exports = module.exports = {}
exports.lastStep = '1433406492804.js';
exports.run = function(ormcache, done) {
	var Profile = ormcache.define('Profile', [{
		name: 'name',
		type: orm.String,
		len: 32,
		notNull: true
	}, {
		name: 'age',
		type: orm.SmallInteger,
		notNull: true
	}], {
		engine: 'Memory',
		charset: 'utf8',
	});

	Profile.referTo(ormcache.User);
	done();
}