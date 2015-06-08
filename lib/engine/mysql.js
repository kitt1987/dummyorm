'use strict'

exports = module.exports = function(properties) {
}

exports.prototype.performSQL = function(sql, cb) {
	cb();
}

exports.prototype.connect = function(cb) {
	cb();
}

exports.prototype.disconnect = function(cb) {
	cb();
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