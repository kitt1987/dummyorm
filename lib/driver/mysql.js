'use strict';

class MySQL {
  constructor(options) {
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

  performSQL(sql) {
    console.log('Ready to run', sql);
    return new Promise((resolve, reject) => {
      this.conn.query({
        sql: sql,
        nestTables: true,
      }, (err, rows) => {
        if (err) {
          reject(err);
          return;
        }

        console.log(sql, 'DONE');
        resolve(rows);
      });
    });
  }

  connect() {
    return new Promise((resolve, reject) => {
      if (this.conn) {
        resolve();
        return;
      }

      this.conn = this.mysql.createConnection(this.opts);
      this.conn.connect((err) => {
        if (err) {
          reject(err);
          return;
        }

        resolve();
      });
    });
  }

  disconnect() {
    if (this.conn) this.conn.end();
  }

  useDB(db) {
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
  }

  runInTransaction(call) {
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
  }
}

module.exports = MySQL;
