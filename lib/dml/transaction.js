'use strict';

var util = require('../utility');

class Transaction {
  constructor(connector, dmlPrototype) {
    this.connector = connector;
    this.pendings = [];
    ['save', 'update', 'del'].forEach((m) => {
      this[m] = (schema, record) => {
        var pending = {
          schema,
          record,
          pending: dmlPrototype[m]
        };
        this.pendings.push(pending);
        return this;
      };
    });
  }

  exec() {
    return this.connector.getStorage().runInTransaction((conn) => {
      var calls = this.pendings.map((p) => {
        return () => p.pending.call(this, p.schema, p.record);
      });

      return util.chainPromise(calls);
    });
  }
}

module.exports = Transaction;
