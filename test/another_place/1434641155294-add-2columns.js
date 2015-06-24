'use strict'
var orm = require('../..');
exports = module.exports = {}
exports.lastStep = '1434338403266-drop_fk.js';
exports.run = function(ormcache, cb) {
	var Profile = ormcache.Profile;
	Profile.addColumn([
		{
			name: 'address',
			type: orm.String,
			len: 30
		}, 
		{
			name: 'pno',
			type: orm.String,
			len: 15
		}
	]);

	cb(Profile);
}
