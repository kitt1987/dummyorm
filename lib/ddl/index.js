'use strict';

var Schema = require('../schema');
var datatype = require('./datatype');

exports = module.exports = {};

function define(tableName, properties, options) {
  var defaultColumn = [{
    name: datatype.UpdateTsField,
    type: datatype.BigInteger,
    notNull: true
  }, {
    name: datatype.IDField,
    type: datatype.Integer,
    primary: true
  }];

  if (Array.isArray(properties)) {
    defaultColumn = defaultColumn.concat(properties);
  } else {
    defaultColumn.push(properties);
  }

  var schema = new Schema(tableName, defaultColumn, options);
  this.schemas.push(schema);
  this[schema.tableName] = schema;
  return schema;
}

// Deprecated
function defineManyToMany(schemaA, schemaB) {
  var schema = this.define(schemaA.tableName + 'M2M' + schemaB.tableName, [],
    schemaA.options);
  schema.referTo(schemaA);
  schema.referTo(schemaB);
  this.schemas.push(schema);
  this[schema.tableName] = schema;
  return schema;
}

module.exports = {
  define,
  defineManyToMany,
};
