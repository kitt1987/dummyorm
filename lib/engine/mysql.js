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

exports.prototype.createRecord = function(record, cb) {
	var pending = record.getPending();
	var columns = [], values = [];
	_.forOwn(pending, function(v, k) {
		columns.push(k);
		values.push(v);
	});

	var sql = util.format('INSERT INTO %s(%s) VALUES(%s)',
		record.schema.tableName, columns.join(','), values.join(','));
	this.conn.query(sql, cb);
}

function describeTable(table_name, cb) {

}

function describeSchema(schema, cb) {
	
}

exports.prototype.buildIndex = function(schema, columns, cb) {

}

exports.prototype.create = function(record, cb) {
}

exports.prototype.delete_ = function(schema, id, cb) {

}

exports.prototype.deleteAll = function(schema, cb) {
	
}

exports.prototype.query = function(query, cb) {
	
}