'use strict';

var Query = require('./query');
var Transaction = require('./transaction');
var ddl = require('../ddl/datatype');

class DML {
  constructor(connector) {
    this.connector = connector;
  }

  save(record) {
    record[ddl.UpdateTsField] = Date.now();
    return this.connector.getStorage().insert(record);
  }

  update(record) {
    record[ddl.UpdateTsField] = Date.now();
    return this.connector.getStorage().update(record);
  }

  del(record) {
    return this.connector.getStorage().del(record);
  }

  query(schema) {
    if (!schema || Array.isArray(schema)) {
      throw new Error(
        'You just could fetch record from the same schema in single query'
      );
    }

    return new Query(this.connector, schema);
  }

  transaction() {
    return new Transaction(this.connector, DML.prototype);
  }
}

module.exports = DML;
