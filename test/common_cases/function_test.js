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
			test.ok(!err);
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
				test.ok(!err, err);
				user.set({
					pw: 'new_password'
				});
				orm.update('some_key', user, function(err) {
					test.ok(!err, err);
					test.eq(user.pw, 'new_password');
					orm.del('some_key', user, function(err) {
						test.ok(!err, err);
						test.done();
					});
				});
			});
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
			test.ok(!err);
			orm.save('u2', u2, function(err) {
				orm.query(user.schema).exec(function(err, result) {
					test.ok(!err);
					test.eq(2, result.length);
					var numCols1 = _.keys(result[0]).length;
					var numCols2 = _.keys(result[1]).length;
					test.eq(numCols1, numCols2);
					test.done();
				});
			});
		});
	},
	// queryColumns: function(test) {
	// 	var self = this;
	// 	var user = orm.User.create({
	// 		uid: 'new_name',
	// 		pw: 'new_password'
	// 	});

	// 	orm.save('key', user, function(err) {
	// 		test.ok(!err);
	// 		orm.query()
	// 			.select(orm.User.id, orm.User.pw)
	// 			.exec(function(err, result) {
	// 				test.ok(!err);
	// 				console.log(util.inspect(result))
	// 				test.eq(2, _.keys(result[0]).length);
	// 				test.done();
	// 			});
	// 	});
	// },
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
			test.ok(!err);
			orm.save(keygen, u2, function(err) {
				orm.query(user.schema)
					.where($(orm.User.uid, '=', u2.uid))
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
			test.ok(!err);
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
			test.ok(!err, err);
			if (!orm.cacheEnabled()) {
				test.done();
				return;
			}

			orm.get(keygen(user), function(err, r) {
				test.ok(!err);
				var obj = JSON.parse(r);
				test.eq(user.uid, obj.uid);
				test.eq(user.pw, obj.pw);
				test.done();
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
			t.ok(!err);
			var profile = orm.Profile.create({
				name: 'u4',
				age: 20,
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
			t.ok(!err);
			var trace = orm.Trace.create({
				trace: 'ttttttttttrace'
			});

			orm.save('traceU5', trace, function(err) {
				t.ok(!err);
				var m = orm.UserM2MTrace.create({
					User: user,
					Trace: trace
				});

				orm.save('', m, function(err) {
					t.ok(!err);
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
			User: user
		});

		var trans = orm.transaction();
		trans.save(user)
			.save(profile)
			.exec(function(err) {
				t.ok(err);
				t.done();
			});
	}
}