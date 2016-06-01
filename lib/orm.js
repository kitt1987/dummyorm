'use strict';

var dml = require('./dml');
var Condition = require('./dml/condition');
var ddl = require('./ddl');
var datatype = require('./ddl/datatype');
var logger = require('./logger');
var engines = require('./engine/connector');

exports = module.exports = function(options) {
  return new ORM(options);
};

Object.assign(exports, datatype);
exports.$ = Condition.$;

function ORM(options) {
  if (!options.tag) throw Error('An unique tag is requisite!');

  this.options = options;
  this.schemas = [];
  logger(options);
  Object.assign(this, logger);
  Object.assign(this, engines);
  Object.assign(this, dml);
  Object.assign(this, ddl);
}
