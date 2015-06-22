'use strict'
var orm = require('../../..');
exports = module.exports = {}
exports.lastStep = '';
exports.run = function(ormcache, cb) {
		// FIXME create or modify schema here and pass the cb to orm		
	// You could access each schema by calling ormcache.schemas[schema_talbe_name].	
	var Profile = ormcache.schemas['Profile'];
	var User = ormcache.schemas['User'];
	User.dropRelation(Profile);
	cb(User);
}
