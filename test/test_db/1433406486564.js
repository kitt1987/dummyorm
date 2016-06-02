'use strict'
exports = module.exports = {}
exports.lastStep = '';
exports.run = function(orm) {
  var User = orm.define('User', [{
    name: 'uid',
    type: orm.DataType.String,
    len: 36,
    notNull: true
  }, {
    name: 'pw',
    type: orm.DataType.String,
    len: 36,
    notNull: true
  }]);

  User.addFullTextColumn('pw');
}
