'use strict';

var Mysql = require('../engine/mysql');
var util = require('../utility');

exports = module.exports = function(ormcache, proto) {
  this.ctx = {
    cache: ormcache.cache
  };
  this.storage = ormcache.storage;
  this.pendings = [];
  ['save', 'update', 'del'].forEach((m) => {
    this[m] = (record) => {
      var pending = {
        record: record,
        pending: proto[m]
      };
      this.pendings.push(pending);
      return this;
    };
  });
};

function transCall(conn) {
  this.ctx.storage = new Mysql({
    liveConn: conn
  });
  var calls = this.pendings.map((p) => {
    return p.pending.bind(this.ctx, p.record);
  });

  return util.seqPromise(calls, this.ctx.storage.useDB(this.storage.db));
}

exports.prototype.exec = function() {
  return this.storage.runInTransaction(transCall.bind(this));
};
