'use strict'
var orm = require('../..');
exports = module.exports = {}
exports.lastStep = '1433406486564.js';
exports.run = function(ormcache, done) {
	// FIXME create or modify schema here and pass the cb to orm 
	// You could access each schema by calling ormcache.schemas[schema_talbe_name].
	var User = ormcache.User;
	User.buildIndex({
		name: 'iId_Name',
		column: [User.id, User.uid],
		type: orm.BtreeIndex
	});
	done();
}