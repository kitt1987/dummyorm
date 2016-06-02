'use strict';
exports = module.exports = {}
exports.lastStep = '1433406486564.js';
exports.run = function(orm) {
  var User = orm.schema.User;
  User.buildIndex({
    name: 'iId_Name',
    column: [User.id, User.uid],
    type: orm.DataType.BtreeIndex
  });
}
