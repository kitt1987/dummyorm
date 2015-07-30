'use strict'
var orm = require('../..');
exports = module.exports = {}
exports.lastStep = '1433406486564.js';
exports.run = function(ormcache, done) {
	var User = ormcache.User;
	User.buildIndex({
		name: 'iId_Name',
		column: [User.id, User.uid],
		type: orm.BtreeIndex
	});
	done();
}