'use strict'
exports = module.exports = {}
exports.lastStep = '';
exports.run = function(ormcache, cb) {
	// FIXME create or modify schema here and pass the cb to orm 		
	// You could access each schema by calling schemas.schema_talbe_name.
	var User = ormcache.define('User', {
		name: {
			type: 'string',
			text_len: 32,
			not_null: true
		}
	});

	cb(User);
}