'use strict';

var ormcache = require('../..');
var path = require('path');
var async = require('async');
var _ = require('lodash');

exports = module.exports = {
	setUp: function(t) {
		var dataSteps = path.join(module.filename, '../../bmdb');
		t.db = "benchdb";
		var orm = ormcache({
			tag: 'benchmark'
		});
		t.orm = orm;
		orm.enableCliLog();
		orm.useMysql({
				server: '192.168.99.100:32768',
				account: 'root:0000',
				privacy: {
					mysql2: true,
					connectTimeout: 1000,
					acquireTimeout: 1000,
					connectionLimit: 1,
					queueLimit: 0
				}
			},
			function(err) {
				if (err) {
					throw err;
				}

				orm.loadSteps(dataSteps, t.db, function(err) {
					if (err)
						throw err;

					t.done();
				});
			});
	},
	tearDown: function(t) {
		var done = [];
		done.push(t.orm.dropDB.bind(t.orm, t.db));
		done.push(t.orm.disconnect.bind(t.orm));
		async.series(done, function() {
			t.done();
		});
	},
	cases: {
		insertion: function(t) {
			var start = _.now();
			var times = 10000;
			async.times(times, function(id, next) {
				var r = t.orm.benchData.create({
					alpha: 1,
					beta: 'hello',
					pi: 3.141
				});

				t.orm.save('', r, function(err, result) {
					t.ok(!err);
					next();
				});
			}, function(err) {
				t.ok(!err);
				console.log('\nInsertion rps:' + Math.round(times * 1000 / ((_.now() - start))));
				t.done();
			});
		},
		selection: function(t) {
			var start = _.now();
			var times = 1000;
			var rows = 0;
			async.times(times, function(id, next) {
				t.orm.query(t.orm.benchData).exec(function(err, result) {
					t.ok(!err);
					t.gt(result.length, 0);
					rows += result.length;
					next();
				});
			}, function(err) {
				t.ok(!err);
				console.log('\nrps:' + Math.round(rows * 1000 / ((_.now() - start))));
				t.done();
			});
		}
	}
};