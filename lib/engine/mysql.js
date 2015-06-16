'use strict'

var mysql = require('mysql');
var _ = require('lodash');
var util = require('util');

exports = module.exports = function(options) {
	this.opts = options;
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

	var sql = util.format('UPDATE %s SET %s WHERE id=%s',
		record.schema.tableName, values.join(','), record.id);
	this.conn.query(sql, cb);
}

exports.prototype.del = function(record, cb) {
	var sql = util.format('DELETE FROM %s WHERE id=%s',
		record.schema.tableName, record.id);
	this.conn.query(sql, cb);
}
