'use strict';
var orm = require('../..');
exports = module.exports = {};
exports.lastStep = '1434641155294-add-2columns.js';
exports.run = function(ormcache) {
  var Profile = ormcache.Profile;
  Profile.referTo(ormcache.User);
};
