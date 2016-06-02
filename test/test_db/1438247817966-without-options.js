'use strict';
exports = module.exports = {};
exports.lastStep = '1435485152524-many-to-many.js';
exports.run = function(orm) {
  orm.define('NoOptions', {
    name: 'NoOp',
    type: orm.DataType.String,
    len: 1,
  });
};
