'use strict'
exports = module.exports = {}
exports.lastStep = '1433406486564.js';
exports.run = function(ormcache, cb) {
	// FIXME create or modify schema here and pass the cb to orm 
	// You could access each schema by calling ormcache.schemas[schema_talbe_name].
	var User = ormcache.schemas['User'];
	User.buildIndex('iId_Name', [User.id, User.name]);
	cb(User);
}
