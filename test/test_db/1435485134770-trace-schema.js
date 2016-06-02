'use strict';
exports = module.exports = {};
exports.lastStep = '1435482913491-add-foreign-key.js';
exports.run = function(orm) {
  orm.define('Trace', {
    name: 'trace',
    type: orm.DataType.String,
    len: 255,
    notNull: true
  }, {
    engine: 'Memory'
  });
};
