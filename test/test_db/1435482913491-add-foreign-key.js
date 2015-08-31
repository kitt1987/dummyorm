'use strict';
var orm = require('../..');
exports = module.exports = {};
exports.lastStep = '1434641155294-add-2columns.js';
exports.run = function(ormcache, done) {
	var Profile = ormcache.Profile;
	var User = ormcache.User;
	Profile.referTo(ormcache.User);
	done();
};
