'use strict';

var Query = require('./query');
var Transaction = require('./transaction');
var ddl = require('../ddl/datatype');

exports = module.exports = {};

exports.save = function(record) {
  record[ddl.UpdateTsField] = Date.now();
  return this.storage.insert(record);
};

exports.update = function(record) {
  record[ddl.UpdateTsField] = Date.now();
  return this.storage.update(record);
};

exports.del = function(record) {
  return this.storage.del(record);
};

exports.query = function(schema) {
  if (!schema || Array.isArray(schema)) {
    throw new Error(
      'You just could fetch record from the same schema in single query'
    );
  }

  return new Query(this, schema);
};

exports.transaction = function() {
  return new Transaction(this, exports);
};
