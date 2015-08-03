'use strict';

var $ = require('../../lib/dml/condition').$;
var ormhelper = require('../../');
var path = require('path');
var async = require('async');
var mysql = require('mysql');
var Redis = require('ioredis');
var MemCached = require('memcached');
var winston = require('winston');

exports = module.exports = {
	setUp: function(__) {
		var stepBox = path.join(process.cwd(), './test/test_db');
		var orm = ormhelper({
			tag: 'live_conn',
			logger: winston
		});

		__.ctx = {
			stepBox: stepBox,
			orm: orm
		};

		orm.useMemcached({
			liveConn: new MemCached('192.168.99.102:32773')
		});

		// this.redis = new Redis({
		// 	host: '192.168.99.100',
		// 	port: 32771
		// });
		// orm.useRedis({
		// 	liveConn: this.redis
		// });

		var mysqlConn = mysql.createConnection({
			host: '192.168.99.102',
			port: 32768,
			user: 'root',
			password: '0000',
			connectTimeout: 1000,
			acquireTimeout: 1000,
			connectionLimit: 2,
			queueLimit: 256,
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
		done.push(orm.dropDB.bind(orm, 'test_db'));
		done.push(orm.disconnect.bind(orm));
		async.series(done, function() {
			__.done();
		});
	},
	functions: require('../common_cases/function_test')
};