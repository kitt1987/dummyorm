'use strict';
var orm = require('../..');
exports = module.exports = {};
exports.lastStep = '1438247817966-without-options.js';
exports.run = function(ormcache) {
  ormcache.Profile.addColumn([{
    name: 'chars',
    type: orm.JSON
  }]);
};
