'use strict';
var orm = require('ormcache.js');
exports = module.exports = {};
exports.lastStep = '1434641155294-add-2columns.js';
exports.run = function(ormcache, cb) {

	// FIXME create or modify schema here and pass the cb to orm
	// You could access each schema by calling ormcache.schemas[schema_talbe_name].

	var Profile = ormcache.Profile;
	var User = ormcache.User;
	Profile.referTo(ormcache.User);
	cb(Profile);
};
