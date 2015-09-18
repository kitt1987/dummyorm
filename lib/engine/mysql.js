'use strict';

var _ = require('lodash');
var util = require('util');

exports = module.exports = function(options) {
	if (options.liveConn) {
		this.conn = options.liveConn;
		this.keepAlive = true;
		return;
	}

	var opts = {};
	if (options.server) {
		if (options.server instanceof Array)
			options.server = options.server[0];
		var server_port = options.server.match(/([^:]+):(.+)/);
		opts.host = server_port[1];
		opts.port = _(server_port[2]).value();
		delete options.server;
	}

	if (options.account) {
		var root_and_pw = options.account.split(/([^:]+):(.+)/);
		opts.user = root_and_pw[1];
		opts.password = root_and_pw[2];
		delete options.account;
	}

	if (options.privacy) {
		if (options.privacy.mysql2) {
			this.mysql = require('mysql2');
			delete options.privacy.mysql2;
		}

		_.assign(opts, options.privacy);
	}

	if (!this.mysql) {
		this.mysql = require('mysql');
	}

	this.opts = opts;
	this.opts.supportBigNumbers = true;
};

exports.prototype.performSQL = function(sql, cb, nested) {
	this.conn.query({
		sql: sql,
		nestTables: nested,
	}, cb);
};

exports.prototype.connect = function(cb) {
	if (this.conn) {
		cb();
		return;
	}

	this.conn = this.mysql.createConnection(this.opts);
	this.conn.connect(cb);
};

exports.prototype.disconnect = function(cb) {
	if (this.conn)
		this.conn.end();
	cb();
};

exports.prototype.useDB = function(db, cb) {
	this.db = db;
	if (this.keepAlive) {
		this.performSQL('USE ' + db, function(err) {
			cb(err);
		});
		return;
	}

	this.conn.end();
	this.pool = true;
	this.conn = this.mysql.createPool(this.opts);
	this.conn.on('connection', function(conn) {
		conn.query('USE ' + db);
	});
	cb();
};

function safeCall(conn, call, cb) {
	try {
		call(conn, function(err) {
			if (err) {
				conn.rollback(function() {
					cb(err);
				});
				return;
			}

			conn.commit(function(err) {
				if (err) {
					conn.rollback(function() {
						cb(err);
					});
					return;
				}
				cb();
			});
		});
	} catch (err) {
		conn.rollback(function() {
			cb(err);
		});
	}
}

exports.prototype.runInTransaction = function(call, cb) {
	if (this.pool) {
		this.conn.getConnection(function(err, conn) {
			if (err) {
				cb(err);
				return;
			}

			conn.beginTransaction(function(err) {
				if (err) {
					conn.release();
					cb(err);
					return;
				}

				safeCall(conn, call, function(err) {
					conn.release();
					cb(err);
				});
			});
		});
		return;
	}

	var self = this;
	this.conn.beginTransaction(function(err) {
		if (err) {
			cb(err);
			return;
		}

		safeCall(self.conn, call, cb);
	});
};

exports.prototype.insert = function(record, cb) {
	var pending = record.getPending();
	var columns = [],
		values = [];
	_.forOwn(pending, function(v, k) {
		columns.push(k);
		values.push(v);
	});

	if (columns.length === 0 || columns.length !== values.length)
		throw new Error('You should set 1 field at least');

	var sql = util.format('INSERT INTO %s(%s) VALUES(%s)',
		record.schema.tableName, columns.join(','), values.join(','));
	this.conn.query(sql, function(err, result) {
		if (!err) {
			record.id = result.insertId;
		}
		cb(err);
	});
};

exports.prototype.update = function(record, cb) {
	var pending = record.getPending();
	var values = [];
	_.forOwn(pending, function(v, k) {
		if (k !== 'id')
			values.push(k + '=' + v);
	});

	if (values.length === 0)
		throw new Error('You should set 1 field at least');

	var sql = util.format('UPDATE %s SET %s WHERE id=%s',
		record.schema.tableName, values.join(','), record.id);

	this.conn.query(sql, cb);
};

exports.prototype.del = function(record, cb) {
	var sql = util.format('DELETE FROM %s WHERE id=%s',
		record.schema.tableName, record.id);
	this.conn.query(sql, cb);
};
