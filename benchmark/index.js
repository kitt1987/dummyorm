'use strict';

var orm = require('../');
var colors = require('colors');
var path = require('path');

function Benchmark(options) {
	this.dataSteps = path.join(module.filename, 'bmdb');
	this.orm = orm();
	this.orm.enableCliLog();
	this.options = options;
}

// same things on single mysql or mysql2

function _runNextBenchmark(options) {
	// Insertion
	// selection
}

Benchmark.prototype.run = function() {
	var self = this;
	if (options.memcached) {
		self.orm.useMemcached({
			server: options.memcached
		});
	}

	if (options.redisCache) {
		self.orm.enableRedisCache({
			server: options.redisCache
		});
	}

	if (options.mysql) {
		var server_account = options.mysql.match(/([^:]+:[^:]+):([^:]+:[^:]+)/);
		console.log(require('util').inspect(server_account));
		self.orm.useMysql({
			server: server_account[1],
			account: server_account[2]
		}, function(err) {
			if (err) {
				console.err(colors.red('Fail to connec to mysql server due to ' + err));
				throw err;
			}

			self.orm.loadSteps(self.dataSteps, function(err) {
				if (err) {
					console.err(colors.red('Fail to create database due to ' + err));
					throw err;
				}

				// run benchmark
			});
		});
	}
}

function getOptions() {
	var ArgumentParser = require('argparse').ArgumentParser;
	var parser = new ArgumentParser({
		version: '0.0.0',
		addHelp: true,
		description: 'Benchmark for ormcache'
	});

	// ip&port
	parser.addArgument(
		['-mc', '--memcached'], {
			help: 'use memcached as cache. eg. \'-mc=ip:port\''
		}
	);

	// ip&port
	parser.addArgument(
		['-rc', '--redisCache'], {
			help: 'use redis as cache. eg. \'-rc=ip:port\''
		}
	);

	// ip&port, user&password
	parser.addArgument(
		['-m2', '--mysql2'], {
			help: 'use mysql2 as mysql client. eg. \'-m2=ip:port:user:password\''
		}
	);

	// ip&port, user&password
	parser.addArgument(
		['-m', '--mysql'], {
			help: 'use mysql2 as mysql client. eg. \'-m=ip:port:user:password\''
		}
	);

	return parser.parseArgs();
};

new Benchmark(getOptions()).run();