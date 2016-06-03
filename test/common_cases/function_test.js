'use strict';

exports = module.exports = {
  loading: function(test) {
    var orm = test.ctx.orm;
    var User = orm.schema.User;
    var user = User.create({
      uid: 'unique_name'
    });
    test.eq(user.uid, 'unique_name');
    user.pw = 'password';
    User.save(user)
      .then((userUpdated) => {
        test.eq(user, userUpdated);
        user.pw = 'new_password';
        return User.update(user);
      })
      .then((userUpdated) => {
        test.eq(user, userUpdated);
        test.eq(user.pw, 'new_password');
        return User.del(user);
      })
      .then(() => test.done())
      .catch((err) => test.nothing(err));
  },
  simpleQuery: function(test) {
    var orm = test.ctx.orm;
    var User = orm.schema.User;
    var user = User.create({
      uid: 'new_name',
      pw: 'new_password'
    });

    var u2 = User.create({
      uid: 'u2',
      pw: 'u2_password'
    });

    User.save(user)
      .then(() => User.save(u2))
      .then(() => User.query().exec())
      .then((result) => {
        test.eq(2, result.length);
        var numCols1 = Object.keys(result[0]).length;
        var numCols2 = Object.keys(result[1]).length;
        test.eq(numCols1, numCols2);
        test.done();
      })
      .catch((err) => test.nothing(err));
  },
  // queryColumns: function(test) {
  //   var orm = test.ctx.orm;
  //   var self = this;
  //   var user = orm.User.create({
  //     uid: 'new_name',
  //     pw: 'new_password'
  //   });
  //
  //   orm.save('key', user, function(err) {
  //     test.ok(!err);
  //     orm.query()
  //       .select(orm.User.id, orm.User.pw)
  //       .exec(function(err, result) {
  //         test.ok(!err);
  //         test.eq(2, _.keys(result[0]).length);
  //         test.done();
  //       });
  //   });
  // },
  removeSomeFields: function(test) {
    var orm = test.ctx.orm;
    var User = orm.schema.User;
    var user = User.create({
      uid: 'new_name123',
      pw: 'new_password'
    });
    User.save(user)
      .then((userUpdated) => {
        user.pw = null;
        return User.update(user);
      })
      .then((userUpdated) => {
        return User.query().where(User.id, '=', user.id).exec();
      })
      .then((result) => {
        test.eq(result[0].pw, '');
        test.done();
      })
      .catch((err) => test.nothing(err));
  },
  // queryCount: function(test) {
  //   var orm = test.ctx.orm;
  //   var self = this;
  //   var user = orm.User.create({
  //     uid: 'new_name',
  //     pw: 'new_password'
  //   });
  //
  //   orm.save('key', user, function(err) {
  //     test.ok(!err);
  //     orm.query(orm.User)
  //       .count()
  //       .exec(function(err, result) {
  //         test.ok(!err);
  //         test.lt(0, result);
  //         test.done();
  //       });
  //   });
  // },
  simpleCondition: function(test) {
    var orm = test.ctx.orm;
    var User = orm.schema.User;
    var user = User.create({
      uid: 'new_name',
      pw: 'new_password'
    });

    var u2 = User.create({
      uid: 'u3',
      pw: 'u2_password'
    });

    User.save(user)
      .then(() => User.save(u2))
      .then(() => {
        return User.query().where(User.uid, '=', u2.uid)
          .orderBy(User.id)
          .limit(1)
          .offset(0)
          .desc()
          .exec();
      })
      .then((result) => {
        test.eq(1, result.length);
        test.eq(u2.uid, result[0].uid);
        test.done();
      })
      .catch((err) => test.nothing(err));
  },
  logicCondition: function(test) {
    var orm = test.ctx.orm;
    var User = orm.schema.User;
    var user = User.create({
      uid: 'u2',
      pw: 'password'
    });

    var u2 = User.create({
      uid: 'u2',
      pw: 'new_password'
    });

    User.save(user)
      .then(() => User.save(u2))
      .then(() => {
        return User.query()
          .where(User.uid, '=', u2.uid, 'AND',
            User.pw, '=', u2.pw)
          .exec();
      })
      .then((result) => {
        test.eq(1, result.length);
        test.eq(u2.uid, result[0].uid);
        test.eq(u2.pw, result[0].pw);
        test.done();
      })
      .catch((err) => test.nothing(err));
  },
  omitJoin: function(test) {
    var orm = test.ctx.orm;
    var {
      User,
      Profile
    } = orm.schema;
    var user = User.create({
      uid: 'new_name',
      pw: 'new_password'
    });

    var profile = Profile.create({
      User: user,
      name: 'xxxx',
      married: true,
      age: 12,
    });

    User.save(user)
      .then(() => {
        return Profile.save(profile);
      })
      .then(() => {
        return Profile.query().exec();
      })
      .then((result) => {
        test.eq(user.pw, result[0].User.pw);
        test.eq(profile.married, !!result[0].married);
        test.done();
      })
      .catch((err) => test.nothing(err));
  },
  // fullTextQuery: function(test) {
  //   var orm = test.ctx.orm;
  //   var self = this;
  //   var user = orm.User.create({
  //     uid: 'new_name',
  //     pw: 'new_password'
  //   });
  //
  //   orm.save('key', user, function(err) {
  //     test.ok(!err);
  //     orm.query(orm.User)
  //       .where($('MATCH (', orm.User.pw, ')', "AGAINST ('*password*' IN BOOLEAN MODE)"))
  //       .exec(function(err, result) {
  //         test.ok(!err);
  //         console.log(result);
  //         test.eq(user.pw, result[0].pw);
  //         test.done();
  //       });
  //   });
  // },
  referToFK: function(t) {
    var orm = t.ctx.orm;
    var {User, Profile} = orm.schema;
    var user = User.create({
      uid: 'u4',
      pw: 'pssssssssss'
    });

    var profile = Profile.create({
      name: 'u4',
      age: 20,
      married: true,
      User: user
    });

    User.save(user)
      .then(() => {
        return Profile.save(profile);
      })
      .then(() => t.done())
      .catch((err) => t.nothing(err));
  },
  jsonData: function(t) {
    var orm = t.ctx.orm;
    var { User, Profile } = orm.schema;
    var user = User.create({
      name: 'u5',
      pw: 'pssssssssss',
    });

    var chars = {
      a: 'a',
      b: 1,
      c: [
        1, 2, 3
      ]
    };

    var profile = Profile.create({
      name: 'u5',
      age: 20,
      married: true,
      User: user,
      chars
    });

    User.save(user)
      .then(() => Profile.save(profile))
      .then(() => Profile.query().where(Profile.name, '=', 'u5').exec())
      .then((result) => {
        t.eq(chars.a, result[0].chars.a);
        t.eq(chars.b, result[0].chars.b);
        t.done();
      })
      .catch((err) => t.nothing(err));
  },
  // many2many: function(t) {
  //   var orm = t.ctx.orm;
  //   var user = orm.User.create({
  //     uid: 'u5',
  //     pw: 'pssssssssss'
  //   });
  //
  //   orm.save('u5pssssssss', user, function(err) {
  //     t.nothing(err);
  //     var trace = orm.Trace.create({
  //       trace: 'ttttttttttrace'
  //     });
  //
  //     orm.save('traceU5', trace, function(err) {
  //       t.nothing(err);
  //       var m = orm.UserM2MTrace.create({
  //         User: user,
  //         Trace: trace
  //       });
  //
  //       orm.save('', m, function(err) {
  //         t.nothing(err);
  //         t.done();
  //       })
  //     });
  //   });
  // },
  transaction: function(t) {
    var orm = t.ctx.orm;
    var { User, Profile } = orm.schema;
    var user = User.create({
      uid: 'u6',
      pw: 'pssssssssss'
    });

    var profile = Profile.create({
      name: 'u6',
      age: 20,
      married: false,
      User: user
    });

    User.transaction()
      .save(User, user)
      .save(Profile, profile)
      .exec()
      .then(() => t.done())
      .catch((err) => t.nothing(err));
  },
  transactionFKs: function(t) {
    var orm = t.ctx.orm;
    var { User, Profile } = orm.schema;
    var user = User.create({
      uid: 'u6',
      pw: 'pssssssssss'
    });

    var profile = Profile.create({
      name: 'u9',
      age: 20,
      User: user
    });

    User.transaction()
      .save(User, user)
      .save(Profile, profile)
      .exec()
      .then(() => t.done())
      .catch((err) => t.nothing(err));
  },
};
