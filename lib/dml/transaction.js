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
        return new Promise((resolve, reject) => {
          resolve(p.pending.call(this, p.schema, p.record));
          console.log('On mapping transactions');
        });
      });

      console.log(calls);
      console.log('Ready to execute transaction##');
      return util.seqPromise(calls);
    });
  }
}

module.exports = Transaction;
