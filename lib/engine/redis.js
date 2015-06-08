'use strict'

exports = module.exports = function(properties) {

}

exports.prototype.connect = function(cb) {
	cb();
}

exports.prototype.disconnect = function(cb) {
	cb();
}

exports.prototype.sync = function(schema, cb) {
	cb();
}

exports.prototype.buildIndex = function(schema, columns, cb) {
	cb();
}

exports.prototype.create = function(record, cb) {
	// save the record
	cb(null, record);
}

exports.prototype.drop = function(schema, cb) {
	cb();
}

exports.prototype.delete_ = function(schema, id, cb) {

}

exports.prototype.deleteAll = function(schema, cb) {

}

exports.prototype.query = function(query, cb) {
	
}