'use strict'

exports = module.exports = {}
exports.Query = Query;

function Query(schema) {
	this.schema = schema;
}

Query.prototype.where = function(condition) {
	return this;
}

Query.prototype.offset = function(offset) {
	return this;
}

Query.prototype.limit = function(limit) {
	return this;
}

Query.prototype.groupBy = function(column) {
	return this;
}

Query.prototype.orderBy = function(column, order) {
	return this;
}

Query.prototype.topLevelOnly = function() {
	return this;
}

Query.prototype.exec = function(cb) {

}