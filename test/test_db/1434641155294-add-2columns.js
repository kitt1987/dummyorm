'use strict'
exports = module.exports = {}
exports.lastStep = '1434338403266-drop_fk.js';
exports.run = function(orm) {
  var Profile = orm.schema.Profile;
  Profile.addColumn([{
    name: 'address',
    type: orm.DataType.String,
    len: 30
  }, {
    name: 'pno',
    type: orm.DataType.String,
    len: 15
  }]);
}
