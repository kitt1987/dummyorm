'use strict';

var ORM = require('../../');
var path = require('path');

module.exports = {
  before: function(t) {
    var stepBox = path.join(process.cwd(), './test/test_db');

    var orm = new ORM({
      tag: 'loader',
      db: 'test_db2',
      schemaPath: stepBox,
      connection: {
        server: 'localhost:32768',
        account: 'root:0000',
        privacy: {
          connectTimeout: 1000,
          acquireTimeout: 1000,
          connectionLimit: 2,
          queueLimit: 256
        }
      }
    });

    t.ctx = {
      stepBox: stepBox,
      orm: orm
    };

    orm.connect()
      .then(() => t.done())
      .catch((err) => t.nothing(err));
  },
  after: function(t) {
    var orm = t.ctx.orm;
    // done.push(orm.dropDB.bind(orm, 'test_db'));
    orm.disconnect();
    t.done();
  },
  functions: require('../common_cases/function_test')
};
