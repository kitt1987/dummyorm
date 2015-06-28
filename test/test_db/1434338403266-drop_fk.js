'use strict'
var orm = require('../..');
exports = module.exports = {}
exports.lastStep = '1434208604937-create_profile.js';
exports.run = function(ormcache, done) {
		// FIXME create or modify schema here and pass the cb to orm		
	// You could access each schema by calling ormcache.schemas[schema_talbe_name].	
	var Profile = ormcache.Profile;
	var User = ormcache.User;
	Profile.dropRelation(User);
	done();
}
