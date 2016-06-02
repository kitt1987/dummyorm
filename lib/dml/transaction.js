'use strict';

var Mysql = require('../driver/mysql');
var util = require('../utility');

class Transaction {
  constructor(connector, dmlPrototype) {
    this.connector = connector;
    this.pendings = [];
    ['save', 'update', 'del'].forEach((m) => {
      this[m] = (record) => {
        var pending = {
          record: record,
          pending: dmlPrototype[m]
        };
        this.pendings.push(pending);
        return this;
      };
    });
  }

  exec() {
    return this.connector.getStorage().runInTransaction((conn) => {
      this.ctx.storage = new Mysql({
        liveConn: conn
      });
      var calls = this.pendings.map((p) => {
        return p.pending.bind(this.ctx, p.record);
      });

      return util.seqPromise(calls, this.ctx.storage.useDB(this.storage.db));
    });
  }
}

module.exports = Transaction;
