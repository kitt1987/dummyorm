'use strict';

var fs = require('fs');
var util = require('util');
var _ = require('lodash');
var $ = require('../..').$;

exports = module.exports = {
  loading: function(test) {
    var orm = test.ctx.orm;
    var stepBox = test.ctx.stepBox;
    orm.currentStep(function(err, step) {
      test.nothing(err);
      test.ok(orm.Profile.address);
      test.ok(orm.Profile.pno);
      var steps = fs.readdirSync(stepBox);
      test.eq(step, parseInt(steps[steps.length - 1].slice(0, 13)));
      var user = orm.User.create({
        uid: 'unique_name'
      });
      test.eq(user.uid, 'unique_name');
      user.set({
        pw: 'password'
      });
      test.eq(user.pw, 'password');
      orm.save('some_key', user, function(err) {
        test.nothing(err);
        user.set({
          pw: 'new_password'
        });
        orm.update('some_key', user, function(err) {
          test.nothing(err);
          test.eq(user.pw, 'new_password');
          orm.del('some_key', user, function(err) {
            test.nothing(err);
            test.done();
          });
        });
      });
    });
  },
  updater: function(test) {
    var orm = test.ctx.orm;
    orm.updater(orm.User)
      .set(orm.User.uid, 'just_updated')
      .set(orm.User.pw, 'also_just_updated')
      .exec(function(err, result) {
        test.nothing(err);
        test.done();
      });
  },
  simpleQuery: function(test) {
    var orm = test.ctx.orm;
    var user = orm.User.create({
      uid: 'new_name',
      pw: 'new_password'
    });

    var u2 = orm.User.create({
      uid: 'u2',
      pw: 'u2_password'
    });

    orm.save('key', user, function(err) {
      test.nothing(err);
      orm.save('u2', u2, function(err) {
        orm.query(user.schema).exec(function(err, result) {
          test.nothing(err);
          test.eq(2, result.length);
          var numCols1 = _.keys(result[0]).length;
          var numCols2 = _.keys(result[1]).length;
          test.eq(numCols1, numCols2);
          test.done();
        });
      });
    });
  },
  queryColumns: function(test) {
    var orm = test.ctx.orm;
    var self = this;
    var user = orm.User.create({
      uid: 'new_name',
      pw: 'new_password'
    });

    orm.save('key', user, function(err) {
      test.ok(!err);
      orm.query()
        .select(orm.User.id, orm.User.pw)
        .exec(function(err, result) {
          test.ok(!err);
          test.eq(2, _.keys(result[0]).length);
          test.done();
        });
    });
  },
  queryCount: function(test) {
    var orm = test.ctx.orm;
    var self = this;
    var user = orm.User.create({
      uid: 'new_name',
      pw: 'new_password'
    });

    orm.save('key', user, function(err) {
      test.ok(!err);
      orm.query(orm.User)
        .select($('COUNT(', orm.User.id, ') AS count'))
        .exec(function(err, result) {
          test.ok(!err);
          test.eq(1, result.length);
          test.lt(0, result[0].count);
          test.done();
        });
    });
  },
  simpleCondition: function(test) {
    var orm = test.ctx.orm;
    var user = orm.User.create({
      uid: 'new_name',
      pw: 'new_password'
    });

    var u2 = orm.User.create({
      uid: 'u3',
      pw: 'u2_password'
    });

    var keygen = function(user) {
      return 'xxxx' + user.id;
    }

    orm.save(keygen, user, function(err) {
      test.nothing(err);
      orm.save(keygen, u2, function(err) {
        orm.query(user.schema)
          .where($(orm.User.uid, '=', u2.uid))
          .orderBy(user.schema.id)
          .limit(1)
          .offset(0)
          .desc()
          .exec(function(err, result) {
            test.ok(!err);
            test.eq(1, result.length);
            test.eq(u2.uid, result[0].uid);
            test.done();
          });
      });
    });
  },
  logicCondition: function(test) {
    var orm = test.ctx.orm;
    var user = orm.User.create({
      uid: 'u2',
      pw: 'password'
    });

    var u2 = orm.User.create({
      uid: 'u2',
      pw: 'new_password'
    });

    orm.save('key', user, function(err) {
      test.nothing(err);
      orm.save('u2', u2, function(err) {
        orm.query(user.schema)
          .where($(orm.User.uid, '=', u2.uid, 'AND',
            orm.User.pw, '=', u2.pw))
          .exec(function(err, result) {
            test.ok(!err);
            test.eq(1, result.length);
            test.eq(u2.uid, result[0].uid);
            test.eq(u2.pw, result[0].pw);
            test.done();
          });
      });
    });
  },
  join: function(test) {
    var orm = test.ctx.orm;
    var self = this;
    var user = orm.User.create({
      uid: 'new_name',
      pw: 'new_password'
    });

    orm.save('key', user, function(err) {
      test.ok(!err);
      var profile = orm.Profile.create({
        User: user.id,
        name: 'xxxx',
        married: true,
        age: 12,
      });

      orm.save('', profile, function(err) {
        test.ok(!err);
        orm.query(orm.Profile)
          .join(orm.User, $(orm.Profile.User, '=', orm.User.id))
          .exec(function(err, result) {
            test.ok(!err);
            console.log(result[0]);
            test.eq(user.pw, result[0].pw);
            test.eq(profile.married, !!result[0].married);
            test.done();
          });
      });
    });
  },
  getCache: function(test) {
    var orm = test.ctx.orm;
    var user = orm.User.create({
      uid: 'u2',
      pw: 'password'
    });

    var keygen = function(user) {
      return 'xxxx' + user.id;
    }

    orm.save(keygen, user, function(err) {
      test.nothing(err);
      if (!orm.cacheEnabled()) {
        test.done();
        return;
      }

      orm.get(keygen(user), function(err, r) {
        test.nothing(err);
        var obj = JSON.parse(r);
        test.eq(user.uid, obj.uid);
        test.eq(user.pw, obj.pw);
        test.done();
      });
    });
  },
  saveSimpleObj: function(t) {
    var orm = t.ctx.orm;
    var fc = fc || {};
    fc.lastTs = _.now();
    if (fc.count) {
      fc.count += 1;
    } else {
      fc.count = 0;
    }

    orm.keepSimple('umh#FC#13323333333', fc, function(err) {
      t.nothing(err);
      orm.keepSimple('umh#FC#::ffff:127.0.0.1', fc, function(err) {
        t.nothing(err);
        t.done();
      });
    });

  },
  referToFK: function(t) {
    var orm = t.ctx.orm;
    var user = orm.User.create({
      uid: 'u4',
      pw: 'pssssssssss'
    });

    orm.save('u4pssssssss', user, function(err) {
      t.nothing(err);
      var profile = orm.Profile.create({
        name: 'u4',
        age: 20,
        married: true,
        User: user
      });

      orm.save('profileu4', profile, function(err) {
        t.ok(!err);
        t.done();
      });
    });
  },
  many2many: function(t) {
    var orm = t.ctx.orm;
    var user = orm.User.create({
      uid: 'u5',
      pw: 'pssssssssss'
    });

    orm.save('u5pssssssss', user, function(err) {
      t.nothing(err);
      var trace = orm.Trace.create({
        trace: 'ttttttttttrace'
      });

      orm.save('traceU5', trace, function(err) {
        t.nothing(err);
        var m = orm.UserM2MTrace.create({
          User: user,
          Trace: trace
        });

        orm.save('', m, function(err) {
          t.nothing(err);
          t.done();
        })
      });
    });
  },
  transaction: function(t) {
    var orm = t.ctx.orm;
    var user = orm.User.create({
      uid: 'u6',
      pw: 'pssssssssss'
    });

    var profile = orm.Profile.create({
      name: 'u6',
      age: 20,
      married: false,
      User: user
    });

    var keygen = function(user) {
      return 'xxxx' + user.id;
    }

    var trans = orm.transaction();
    trans.save(keygen, user)
      .save(keygen, profile)
      .exec(function(err) {
        t.nothing(err);
        t.done();
      });
  },
  transactionAgain: function(t) {
    var orm = t.ctx.orm;
    var user = orm.User.create({
      uid: 'u6',
      pw: 'pssssssssss'
    });

    var profile = orm.Profile.create({
      name: 'u9',
      age: 20,
      User: user
    });

    var keygen = function(user) {
      return 'xxxx' + user.id;
    }

    var trans = orm.transaction();
    trans.save(keygen, user)
      .save(keygen, profile)
      .exec(function(err) {
        t.nothing(err);
        t.done();
      });
  },
  flushCache: function(t) {
    var orm = t.ctx.orm;
    orm.cache.flush(function(err) {
      t.nothing(err);
      t.done();
    });
  },
}
