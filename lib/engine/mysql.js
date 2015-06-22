'use strict'

var _ = require('lodash');
var util = require('util');
var mysql = require('mysql');

exports = module.exports = function(options) {
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

	if (options.privacy)
		_.assign(opts, options.privacy);

	this.opts = opts;
}

exports.prototype.performSQL = function(sql, cb) {
	this.conn.query(sql, cb);
}

exports.prototype.connect = function(cb) {
	this.conn = mysql.createConnection(this.opts);
	this.conn.connect(cb);
}

exports.prototype.disconnect = function(cb) {
	if (this.conn)
		this.conn.end();
	cb();
}

exports.prototype.useDB = function(db) {
	this.conn.end();
	this.conn = mysql.createPool(this.opts);
	this.conn.on('connection', function(conn) {
		conn.query('USE ' + db);
	})
}

exports.prototype.insert = function(record, cb) {
	var pending = record.getPending();
	var columns = [], values = [];
	_.forOwn(pending, function(v, k) {
		columns.push(k);
		values.push(v);
	});

	if (columns.length == 0 || columns.length != values.length)
		throw new Error('You should set 1 field at least');

	var sql = util.format('INSERT INTO %s(%s) VALUES(%s)',
		record.schema.tableName, columns.join(','), values.join(','));
	this.conn.query(sql, function(err, result) {
		if (!err) {
			record.id = result.insertId;
		}
		cb(err);
	});
}

exports.prototype.update = function(record, cb) {
	var pending = record.getPending();
	var values = [];
	_.forOwn(pending, function(v, k) {
		if (k !== 'id')
			values.push(k + '=' + v);
	});

	if (values.length == 0)
		throw new Error('You should set 1 field at least');

	var sql = util.format('UPDATE %s SET %s WHERE id=%s',
		record.schema.tableName, values.join(','), record.id);
	this.conn.query(sql, cb);
}

exports.prototype.del = function(record, cb) {
	var sql = util.format('DELETE FROM %s WHERE id=%s',
		record.schema.tableName, record.id);
	this.conn.query(sql, cb);
}
