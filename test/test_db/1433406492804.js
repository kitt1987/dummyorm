'use strict'
var orm = require('../..');
exports = module.exports = {}
exports.lastStep = '1433406486564.js';
exports.run = function(ormcache, cb) {
	// FIXME create or modify schema here and pass the cb to orm 
	// You could access each schema by calling ormcache.schemas[schema_talbe_name].
	var User = ormcache.schemas['User'];
	User.buildIndex({
		name: 'iId_Name',
		column: [User.id, User.name],
		type: orm.BtreeIndex
	});
	cb(User);
}