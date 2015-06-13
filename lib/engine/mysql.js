'use strict'

var mysql = require('mysql');

exports = module.exports = function(options) {
	this.opts = options;
}

exports.prototype.performSQL = function(sql, cb) {
	this.conn.query(sql, cb);
}

exports.prototype.connect = function(cb) {
	this.conn = mysql.createPool(this.opts);
	cb();
}

exports.prototype.disconnect = function(cb) {
	if (this.conn)
		this.conn.end();
	cb();
}

exports.prototype.useDB = function(db) {
	this.conn.on('connection', function(conn) {
		conn.query('USE ' + db);
	})
}

exports.prototype.sync = function(schema, cb) {

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