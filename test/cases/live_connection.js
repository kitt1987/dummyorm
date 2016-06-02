'use strict';

var ORM = require('../../');
var path = require('path');
var mysql = require('mysql2');

exports = module.exports = {
  before: function(__) {
    var mysqlConn = mysql.createConnection({
      host: 'localhost',
      port: 32768,
      user: 'root',
      password: '0000',
      supportBigNumbers: true,
      connectTimeout: 1000,
      acquireTimeout: 1000,
      connectionLimit: 2,
      queueLimit: 256,
      // debug: true,
    });

    mysqlConn.connect((err) => {
      if (err) throw err;

      var stepBox = path.join(process.cwd(), './test/test_db');
      var orm = new ORM({
        tag: 'live_conn',
        db: 'test_db',
        schemaPath: stepBox,
        connection: {
          liveConn: mysqlConn
        }
      });

      __.ctx = {
        stepBox: stepBox,
        orm: orm
      };

      orm.connect()
        .then(() => __.done())
    });
  },
  after: function(__) {
    if (!__.ctx) {
      __.done();
      return;
    }

    var orm = __.ctx.orm;
    var done = [];
    // done.push(orm.dropDB.bind(orm, 'test_db'));
    done.push(orm.disconnect.bind(orm));
    __.done();
  },
  functions: require('../common_cases/function_test')
};
