'use strict'
exports = module.exports = {}
exports.lastStep = '1434208604937-create_profile.js';
exports.run = function(ormcache) {
  var Profile = ormcache.Profile;
  var User = ormcache.User;
  Profile.dropRelation(User);
}
