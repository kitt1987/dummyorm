'use strict';

var $ = require('../../lib/dml/condition').$;
var ormhelper = require('../../');
var path = require('path');
var async = require('async');
var mysql = require('mysql');
var Redis = require('ioredis');
var MemCached = require('memcached');

exports = module.exports = {
	setUp: function(__) {
		var stepBox = path.join(process.cwd(), './test/test_db');
		var orm = ormhelper({
			tag: 'live_conn'
		});

		__.ctx = {
			stepBox: stepBox,
			orm: orm
		};

		orm.enableCliLog();
		orm.useMemcached({
			liveConn: new MemCached('192.168.99.100:32770')
		});

		// this.redis = new Redis({
		// 	host: '192.168.99.100',
		// 	port: 32771
		// });
		// orm.useRedis({
		// 	liveConn: this.redis
		// });

		var mysqlConn = mysql.createConnection({
			host: '192.168.99.100',
			port: 32768,
			user: 'root',
			password: '0000',
			connectTimeout: 1000,
			acquireTimeout: 1000,
			connectionLimit: 2,
			queueLimit: 256
		});

		mysqlConn.connect(function(err) {
			if (err)
				throw err;
			orm.useMysql({
				liveConn: mysqlConn
			}, function(err) {
				if (err) {
					throw err;
				}

				orm.loadSteps(stepBox, 'test_db', function(err) {
					if (err)
						throw err;

					__.done();
				});
			});
		});
	},
	tearDown: function(__) {
		var orm = __.ctx.orm;
		var done = [];
		if (orm.User)
			done.push(orm.drop.bind(orm, orm.User));

		if (orm.Profile)
			orm.drop.bind(orm, orm.Profile);

		done.push(orm.dropDB.bind(orm, 'test_db'));
		done.push(orm.disconnect.bind(orm));
		async.series(done, function() {
			__.done();
		});
	},
	functions: require('../common_cases/function_test')
};