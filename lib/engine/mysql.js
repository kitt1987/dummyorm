'use strict';

var _ = require('lodash');
var util = require('util');

function MySQL(options) {
  if (options.liveConn) {
    this.conn = options.liveConn;
    this.keepAlive = true;
    return;
  }

  var opts = {};
  if (options.server) {
    if (options.server instanceof Array) {
      options.server = options.server[0];
    }

    var server_port = options.server.match(/([^:]+):(.+)/);
    opts.host = server_port[1];
    opts.port = parseInt(server_port[2]);
    delete options.server;
  }

  if (options.account) {
    var root_and_pw = options.account.split(/([^:]+):(.+)/);
    opts.user = root_and_pw[1];
    opts.password = root_and_pw[2];
    delete options.account;
  }

  if (options.privacy) {
    Object.assign(opts, options.privacy);
  }

  if (!this.mysql) {
    this.mysql = require('mysql2');
  }

  this.opts = opts;
  this.opts.supportBigNumbers = true;
}

MySQL.prototype.performSQL = function(sql) {
  return new Promise((resolve, reject) => {
    this.conn.query({
      sql: sql,
      nestTables: true,
    }, (err, rows) => {
      if (err) {
        reject(err);
        return;
      }

      resolve(rows);
    });
  });
};

MySQL.prototype.connect = function() {
  if (this.conn) return;
  this.conn = this.mysql.createConnection(this.opts);
  return new Promise((resolve, reject) => {
    this.conn.connect((err) => {
      if (err) {
        reject(err);
        return;
      }

      resolve();
    });
  });
};

MySQL.prototype.disconnect = function(cb) {
  if (this.conn) this.conn.end();
};

MySQL.prototype.useDB = function(db) {
  if (this.keepAlive) {
    return this.performSQL('USE ' + db)
      .then(() => this.db = db);
  }

  return new Promise((resolve, reject) => {
    if (this.conn) this.conn.end();
    this.pool = true;
    this.conn = this.mysql.createPool(this.opts);
    this.conn.on('connection', (conn) => {
      conn.query('USE ' + db, (err, result) => {
        if (err) {
          reject(err);
          return;
        }

        resolve();
        this.db = db;
      });
    });
  });
};

function safeCall(conn, call) {
  return call(conn)
    .then(() => {
      conn.commit((err) => {
        if (err) throw err;
      });
    })
    .catch((err) => {
      conn.rollback(() => {
        throw err;
      });
    });
}

MySQL.prototype.runInTransaction = function(call) {
  return new Promise((resolve, reject) => {
    if (this.pool) {
      this.conn.getConnection((err, conn) => {
        if (err) {
          reject(err);
          return;
        }

        conn.beginTransaction((err) => {
          if (err) {
            conn.release();
            reject(err);
            return;
          }

          resolve(
            safeCall(conn, call)
            .then(() => conn.release())
          );
        });
      });
      return;
    }

    this.conn.beginTransaction((err) => {
      if (err) {
        reject(err);
        return;
      }

      resolve(safeCall(this.conn, call));
    });
  });
};

MySQL.prototype.insert = function(record) {
  return new Promise((resolve, reject) => {
    var pending = record.getPending();
    var columns = [],
      values = [];
    _.forOwn(pending, (v, k) => {
      columns.push(k);
      values.push(v);
    });

    if (columns.length === 0 || columns.length !== values.length)
      throw new Error('You should set 1 field at least');

    var sql = util.format('INSERT INTO %s(%s) VALUES(%s)',
      record.schema.tableName, columns.join(','), values.join(','));
    this.conn.query(sql, (err, result) => {
      if (err) {
        reject(err);
        return;
      }

      record.id = result.insertId;
      resolve();
    });
  });
};

MySQL.prototype.update = function(record) {
  return new Promise((resolve, reject) => {
    // FIXME just update columns changed.
    var pending = record.getPending();
    var values = [];
    _.forOwn(pending, function(v, k) {
      if (k !== 'id') {
        values.push(k + '=' + v);
      }
    });

    if (values.length === 0) {
      throw new Error('You should set 1 field at least');
    }

    var sql = util.format('UPDATE %s SET %s WHERE id=%s',
      record.schema.tableName, values.join(','), record.id);

    this.conn.query(sql, (err, result) => {
      if (err) {
        reject(err);
        return;
      }

      resolve();
    });
  });
};

MySQL.prototype.del = function(record) {
  return new Promise((resolve, reject) => {
    var sql = util.format('DELETE FROM %s WHERE id=%s',
      record.schema.tableName, record.id);
    this.conn.query(sql, (err, result) => {
      if (err) {
        reject(err);
        return;
      }

      resolve();
    });
  });
};

module.exports = MySQL;
