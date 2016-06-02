'use strict';
exports = module.exports = {};
exports.lastStep = '1438247817966-without-options.js';
exports.run = function(orm) {
  orm.schema.Profile.addColumn([{
    name: 'chars',
    type: orm.DataType.JSON
  }]);
};
