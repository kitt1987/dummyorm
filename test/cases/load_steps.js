'use strict'

var $ = require('../../lib/dml/condition').$;
var ormhelper = require('../../');
var path = require('path');
var async = require('async');
var _ = require('lodash');
var util = require('util');

module.exports = {
  before: function(t) {
    var stepBox = path.join(process.cwd(), './test/test_db');

    var orm = ormhelper({
      tag: 'loader'
    });

    t.ctx = {
      stepBox: stepBox,
      orm: orm
    };

    orm.useMysql({
        server: '192.168.99.102:32768',
        account: 'root:0000',
        privacy: {
          mysql2: true,
          connectTimeout: 1000,
          acquireTimeout: 1000,
          connectionLimit: 2,
          queueLimit: 256
        }
      },
      function(err) {
        if (err) {
          throw err;
        }

        orm.loadSteps(stepBox, 'test_db', function(err) {
          if (err)
            throw err;

          t.done();
        });
      });
  },
  after: function(t) {
    var orm = t.ctx.orm;
    var done = [];
    done.push(orm.dropDB.bind(orm, 'test_db'));
    async.series(done, function() {
      orm.disconnect();
      t.done();
    });
  },
  functions: require('../common_cases/function_test')
}
