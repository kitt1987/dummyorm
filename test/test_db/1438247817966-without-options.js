'use strict';
var orm = require('../..');
exports = module.exports = {};
exports.lastStep = '1435485152524-many-to-many.js';
exports.run = function(ormcache) {
  ormcache.define('NoOptions', {
    name: 'NoOp',
    type: orm.String,
    len: 1,
  });
};
