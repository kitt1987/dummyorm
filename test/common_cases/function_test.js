'use strict';

var fs = require('fs');
var util = require('util');
var _ = require('lodash');
var $ = require('../../lib/dml/condition').$;

exports = module.exports = {
	loading: function(test) {
		var orm = test.ctx.orm;
		var stepBox = test.ctx.stepBox;
		orm.currentStep(function(err, step) {
			test.ok(!err);
			test.ok(orm.Profile.address);
			test.ok(orm.Profile.pno);
			var steps = fs.readdirSync(stepBox[stepBox.length - 1]);
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

		orm.save('key', user, function(err) {
			test.ok(!err);
			orm.save('u2', u2, function(err) {
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

		orm.save('key', user, function(err) {
			test.ok(!err, err);
			if (!orm.cacheEnabled()) {
				test.done();
				return;
			}

			orm.get('key', function(err, r) {
				test.ok(!err, err);
				var obj = JSON.parse(r);
				test.eq(user.uid, obj.uid);
				test.eq(user.pw, obj.pw);
				test.done();
			});
		});
	}
}