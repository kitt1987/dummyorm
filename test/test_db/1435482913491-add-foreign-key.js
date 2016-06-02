'use strict';
exports = module.exports = {};
exports.lastStep = '1434641155294-add-2columns.js';
exports.run = function(orm) {
  var Profile = orm.schema.Profile;
  Profile.referTo(orm.schema.User);
};
