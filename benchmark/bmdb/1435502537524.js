'use strict';
var orm = require('ormcache.js');
exports = module.exports = {};
exports.lastStep = '';
exports.run = function(ormcache, done) {

  ormcache.define('benchData', [{
    name: 'alpha',
    type: orm.Integer
  }, {
    name: 'beta',
    type: orm.String,
    len: 128
  }, {
    name: 'pi',
    type: orm.Float
  }], {
    engine: 'Memory'
  });

  done();
};
