'use strict';
var orm = require('ormcache.js');
exports = module.exports = {};
exports.lastStep = '1435485134770-trace-schema.js';
exports.run = function(ormcache, done) {

	// FIXME create or modify schema here and pass the cb to orm
	// You could access each schema by calling ormcache.schemas[schema_talbe_name].

	var m2m = ormcache.defineManyToMany(ormcache.User, ormcache.Trace);
	done();
};
