'use strict'

var ormhelper = require('../');
var path = require('path');
var async = require('async');
var fs = require('fs');
var _ = require('lodash');
var util = require('util');

process.on('uncaughtException', function(err) {
	console.error(err.stack);
});

module.exports = {
	setUp: function(cb) {
		var self = this;
		this.stepBox = [
			path.join(process.cwd(), './test/test_db'),
			path.join(process.cwd(), './test/another_place/test_db')
		];
		this.table_name = 'user';
		this.orm = ormhelper();
		this.orm.enableCliLog();
		this.orm.useRedisCache({
			host: '192.168.99.100',
			port: 32769,
			family: 4
		});
		this.orm.useMysql({
				host: '192.168.99.100',
				port: 32768,
				user: 'root',
				password: '0000',
				connectTimeout: 1000,
				acquireTimeout: 1000,
				connectionLimit: 2,
				queueLimit: 256
			},
			function(err) {
				if (err) {
					throw err;
				}

				self.orm.loadSteps(self.stepBox, function(err) {
					if (err)
						throw err;

					cb();
				});
			});
	},
	tearDown: function(cb) {
		if (!this.orm.schemas)
			return;

		var done = [];
		if (this.orm.schemas.User)
			done.push(this.orm.drop.bind(this.orm, this.orm.schemas.User));

		if (this.orm.schemas.Profile)
			this.orm.drop.bind(this.orm, this.orm.schemas.Profile);

		done.push(this.orm.dropDB.bind(this.orm, 'test_db'));
		done.push(this.orm.disconnect.bind(this.orm));
		async.series(done, cb);
	},
	loading: function(test) {
		var self = this;
		this.orm.currentStep(function(err, step) {
			test.ok(!err);
			test.ok(self.orm.schemas.Profile.address);
			test.ok(self.orm.schemas.Profile.pno);
			var steps = fs.readdirSync(self.stepBox[self.stepBox.length-1]);
			test.equal(step, _(steps[steps.length - 1].slice(0, 13)).value());
			var user = self.orm.schemas.User.create({
				uid: 'unique_name'
			});
			test.equal(user.uid, 'unique_name');
			user.set({
				pw: 'password'
			});
			test.equal(user.pw, 'password');
			self.orm.save('some_key', user, function(err) {
				test.ok(!err, err);
				user.set({
					pw: 'new_password'
				});
				self.orm.update('some_key', user, function(err) {
					test.ok(!err, err);
					test.equal(user.pw, 'new_password');
					self.orm.del('some_key', user, function(err) {
						test.ok(!err, err);
						test.done();
					});
				})
			});
		});
	},
	simpleQuery: function(test) {
		var self = this;
		var user = this.orm.schemas.User.create({
			uid: 'new_name',
			pw: 'new_password'
		});

		var u2 = this.orm.schemas.User.create({
			uid: 'u2',
			pw: 'u2_password'
		});

		this.orm.save('key', user, function(err) {
			test.ok(!err);
			self.orm.save('u2', u2, function(err) {
				self.orm.query(user.schema).exec(function(err, result) {
					test.ok(!err);
					console.log(util.inspect(result))
					test.equal(2, result.length);
					var numCols1 = _.keys(result[0]).length
					var numCols2 = _.keys(result[1]).length
					test.equal(numCols1, numCols2);
					test.done();
				});
			});
		});
	},
	queryColumns: function(test) {
		var self = this;
		var user = this.orm.schemas.User.create({
			uid: 'new_name',
			pw: 'new_password'
		});

		this.orm.save('key', user, function(err) {
			test.ok(!err);
			self.orm.query()
				.select(self.orm.schemas.User.id, self.orm.schemas.User.pw)
				.exec(function(err, result) {
					test.ok(!err);
					console.log(util.inspect(result))
					test.equal(2, _.keys(result[0]).length);
					test.done();
				});
		});
	},
	simpleCondition: function(test) {
		var self = this;
		var user = this.orm.schemas.User.create({
			uid: 'new_name',
			pw: 'new_password'
		});

		var u2 = this.orm.schemas.User.create({
			uid: 'u2',
			pw: 'u2_password'
		});

		this.orm.save('key', user, function(err) {
			test.ok(!err);
			self.orm.save('u2', u2, function(err) {
				self.orm.query(user.schema)
				.where(self.orm.condition().eq(self.orm.schemas.User.uid, u2.uid))
				.exec(function(err, result) {
					test.ok(!err);
					console.log(util.inspect(result))
					test.equal(1, result.length);
					test.equal(u2.uid, result[0].uid);
					test.done();
				});
			});
		});
	},
	logicCondition: function(test) {
		var self = this;
		var user = this.orm.schemas.User.create({
			uid: 'u2',
			pw: 'password'
		});

		var u2 = this.orm.schemas.User.create({
			uid: 'u2',
			pw: 'new_password'
		});

		this.orm.save('key', user, function(err) {
			test.ok(!err);
			self.orm.save('u2', u2, function(err) {
				self.orm.query(user.schema)
				.where(self.orm.condition().eq(self.orm.schemas.User.uid, u2.uid)
					.and(self.orm.condition().eq(self.orm.schemas.User.pw, u2.pw)))
				.exec(function(err, result) {
					test.ok(!err);
					console.log(util.inspect(result))
					test.equal(1, result.length);
					test.equal(u2.uid, result[0].uid);
					test.equal(u2.pw, result[0].pw);
					test.done();
				});
			});
		});
	},
	getCache: function(test) {
		var self = this;
		var user = this.orm.schemas.User.create({
			uid: 'u2',
			pw: 'password'
		});

		this.orm.save('key', user, function(err) {
			test.ok(!err, err);
			self.orm.get('key', function(err, r) {
				test.ok(!err, err);
				var obj = JSON.parse(r);
				test.equal(user.uid, obj.uid);
				test.equal(user.pw, obj.pw);
				test.done();
			});
		});
	}
}