'use strict';

var Query = require('./query');
var Transaction = require('./transaction');
const util = require('util');
const _ = require('lodash');
var PrivateFuncHelper = require('../private_helper');

class DML extends PrivateFuncHelper {
  constructor(connector) {
    super();
    this.connector = connector;
  }

  save(schema, record) {
    var pending = schema.getPendingColumns(record);
    var columns = [],
      values = [];
    _.forOwn(pending, (v, k) => {
      columns.push(k);
      values.push(v);
    });

    if (columns.length === 0 || columns.length !== values.length)
      throw new Error('You should set 1 field at least');

    var sql = util.format('INSERT INTO %s(%s) VALUES(%s)',
      schema.tableName, columns.join(','), values.join(','));
    return this.connector.getStorage().performSQL(sql)
      .then((result) => {
        record.id = result.insertId;
      });
  }

  update(schema, record) {
    var pending = schema.getPendingColumns(record);
    var values = [];
    _.forOwn(pending, (v, k) => {
      if (k !== 'id') values.push(k + '=' + v);
    });

    if (values.length === 0) {
      throw new Error('You should set 1 field at least');
    }

    var sql = util.format('UPDATE %s SET %s WHERE id=%s',
      schema.tableName, values.join(','), record.id);
    return this.connector.getStorage().performSQL(sql);
  }

  del(schema, record) {
    var sql = util.format('DELETE FROM %s WHERE id=%s',
      schema.tableName, record.id);
    return this.connector.getStorage().performSQL(sql);
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
