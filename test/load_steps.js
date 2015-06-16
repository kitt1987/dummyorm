'use strict'

var ormhelper = require('../');
var path = require('path');
var async = require('async');
var fs = require('fs');
var _ = require('lodash');

process.on('uncaughtException', function(err) {
	console.error(err.stack);
});

module.exports = {
	setUp: function(cb) {
		this.table_name = 'user';
		this.orm = ormhelper();
		this.orm.enableCliLog();
		this.orm.useMemoryCache({
			size: '256M'
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

				cb();
			});
	},
	tearDown: function(cb) {
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
		test.ok(this.orm.loadSteps);
		var stepBox = path.join(process.cwd(), './test/test_db');
		var self = this;
		this.orm.loadSteps(stepBox, function(err) {
			test.ok(!err, err);
			self.orm.currentStep(function(err, step) {
				var steps = fs.readdirSync(stepBox);
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
		});

		// user.sync(function(err) {
		// 	test.ok(!err);
		// 	var user_a = user.create({
		// 		name: 'Sakura',
		// 		age: 22
		// 	});

		// 	test.equal(user_a.name, 'Sakura');
		// 	test.equal(user_a.age, 22);

		// 	user_a.save(function(err, saved) {
		// 		test.ok(!err);
		// 		test.equal(user_a.name, saved.name);
		// 		test.equal(user_a.age, saved.age);
		// 	});

		// 	test.done();
		// });
	}
}