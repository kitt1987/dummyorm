'use strict'
var ormcache = require('ormcache');
exports = module.exports = {}
exports.lastStep = '';
exports.run = function(schemas, cb) {
	// FIXME create or modify schema here and pass the cb to orm 		
	// You could access each schema by calling schemas.schema_talbe_name.
	var User = ormcache.define('User', {
		name: {
			type: 'string',
			text_len: 32,
			not_null: true
		}
	});

	User.buildIndex([User.id, User.name]);
	cb(User);
}