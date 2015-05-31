'use strict'

exports = module.exports = {
	engine: Redis
}

function Redis(properties) {

}

Redis.prototype.connect = function(cb) {
	
}

Redis.prototype.sync = function(schema, cb) {
	cb();
}

Redis.prototype.buildIndex = function(schema, columns, cb) {
	cb();
}

Redis.prototype.create = function(record, cb) {
	// save the record
	cb(null, record);
}

Redis.prototype.drop = function(schema, cb) {
	cb();
}

Redis.prototype.delete_ = function(schema, id, cb) {

}

Redis.prototype.deleteAll = function(schema, cb) {

}

Redis.prototype.query = function(query, cb) {
	
}