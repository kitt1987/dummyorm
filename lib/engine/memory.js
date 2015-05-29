'use strict'

exports = module.exports = {
	engine: Memory
}

function Memory(properties) {

}

Memory.prototype.connect = function(cb) {
	cb();
}

Memory.prototype.sync = function(schema, cb) {
	cb();
}

Memory.prototype.buildIndex = function(schema, columns, cb) {
	cb();
}

Memory.prototype.create = function(record, cb) {
	// save the record
	cb(null, record);
}

Memory.prototype.delete_ = function(schema, id, cb) {

}

Memory.prototype.deleteAll = function(schema, cb) {

}