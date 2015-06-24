'use strict'
var orm = require('../..');
exports = module.exports = {}
exports.lastStep = '';
exports.run = function(ormcache, cb) {
	// FIXME create or modify schema here and pass the cb to orm 		
	// You could access each schema by calling schemas.schema_talbe_name.
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
	}], 'Memory');

	cb(User);
}