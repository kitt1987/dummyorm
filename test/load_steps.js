'use strict'

var ormhelper = require('../');
var path = require('path');
var async = require('async');

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
				password: '0000'
			},
			function(err) {
				if (err) {
					throw err;
				}

				cb();
			});
	},
	tearDown: function(cb) {
		async.series([
				this.orm.drop.bind(this.orm, this.orm.schemas.User),
				this.orm.dropDB.bind(this.orm, 'test_db'),
				this.orm.disconnect.bind(this.orm)
			],
			cb);
	},
	loadNormalDefinitionAndIndexBuilding: function(test) {
		test.ok(this.orm.loadSteps);
		var stepBox = path.join(process.cwd(), './test/test_db');
		this.orm.loadSteps(stepBox, function(err) {
			test.ok(!err);
			test.done();
		});
		// var user = this.orm.define(this.table_name, {
		// 	name: {
		// 		type: ormhelper.String,
		// 		len: 32,
		// 		not_null: true
		// 	},
		// 	age: {
		// 		type: ormhelper.TinyInteger,
		// 	}
		// });
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