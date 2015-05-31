'use strict'

var util = exports = module.exports = {};

util.calcObjectKey = function(schema, id) {
	return schema.table_name + id;
}