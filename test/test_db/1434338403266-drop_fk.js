'use strict'
exports = module.exports = {}
exports.lastStep = '1434208604937-create_profile.js';
exports.run = function(orm) {
  var Profile = orm.schema.Profile;
  var User = orm.schema.User;
  Profile.dropRelation(User);
};
