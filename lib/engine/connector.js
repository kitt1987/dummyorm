'use strict';

var Mysql = require('./mysql');
var StepLoader = require('../ddl/step_loader');

exports = module.exports = {};

exports.useMysql = function(properties) {
  if (this.storage) throw new Error('Storage has been defined');
  this.storage = new Mysql(properties);
  return this.storage.connect()
    .then(() => {
      StepLoader.call(this, this.storage, this.options.tag);
      Object.assign(this, StepLoader);
    });
};

exports.disconnect = function() {
  this.storage.disconnect();
};
