'use strict';
exports = module.exports = {}
exports.lastStep = '1433406492804.js';
exports.run = function(orm) {
  var Profile = orm.define('Profile', [{
    name: 'name',
    type: orm.DataType.String,
    len: 32,
    notNull: true,
    unique: true,
  }, {
    name: 'age',
    type: orm.DataType.SmallInteger,
    notNull: true
  }, {
    name: 'married',
    type: orm.DataType.Bool,
  }], {
    // engine: 'Memory',
    charset: 'utf8',
  });

  Profile.referTo(orm.schema.User);
  Profile.buildIndex({
    name: 'iProfileUser',
    column: [Profile.User],
  });
}
