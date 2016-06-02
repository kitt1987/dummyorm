'use strict';

var Schema = require('../schema');
var datatype = require('./datatype');

class DDL {
  constructor(connector) {
    this.schema = {};
    this.connector = connector;
    this.DataType = datatype;
  }

  define(tableName, properties, options) {
    if (this.schema[tableName])
      throw new Error('Table ' + tableName + ' exists.');

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

    var schema = new Schema(this.connector, tableName, defaultColumn, options);
    this.schema[tableName] = schema;
    return schema;
  }

  // Deprecated
  defineManyToMany(schemaA, schemaB) {
    var schema = this.define(schemaA.tableName + 'M2M' + schemaB.tableName, [],
      schemaA.options);
    schema.referTo(schemaA);
    schema.referTo(schemaB);
    return schema;
  }

  getPendingSchema() {
    return Object.keys(this.schema).map((k) => this.schema[k]).reduce(
      (pending, schema) => {
        // FIXME keep order
        if (Object.keys(schema.pending).length > 0)
          pending.push(schema);
        return pending;
      }, []);
  }
}

module.exports = DDL;
