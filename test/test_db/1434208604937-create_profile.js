'use strict'
var orm = require('../..');
exports = module.exports = {}
exports.lastStep = '1433406492804.js';
exports.run = function(ormcache, cb) {
	// FIXME create or modify schema here and pass the cb to orm		
	// You could access each schema by calling ormcache.schemas[schema_talbe_name].	
	var Profile = ormcache.define('Profile', [{
		name: 'name',
		type: orm.String,
		len: 32,
		notNull: true
	}, {
		name: 'age',
		type: orm.SmallInteger,
		notNull: true
	}]);

	var User = ormcache.schemas['User'];
	User.contains(Profile);

	cb([Profile, User]);
}