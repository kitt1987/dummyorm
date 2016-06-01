'use strict'
var orm = require('../..');
exports = module.exports = {}
exports.lastStep = '1433406492804.js';
exports.run = function(ormcache) {
  var Profile = ormcache.define('Profile', [{
    name: 'name',
    type: orm.String,
    len: 32,
    notNull: true,
    unique: true,
  }, {
    name: 'age',
    type: orm.SmallInteger,
    notNull: true
  }, {
    name: 'married',
    type: orm.Bool,
  }], {
    engine: 'Memory',
    charset: 'utf8',
  });

  Profile.referTo(ormcache.User);
  Profile.buildIndex({
    name: 'iProfileUser',
    column: [Profile.User],
  });
}
