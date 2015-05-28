'use strict'

exports = module.exports = {}
exports.Record = Record;

function Record(schema, properties) {
	this.schema = schema;
}

Record.prototype.save = function(cb) {
	this.schema.save(this, cb);
}

Record.prototype.update = function(/* some_schema, properties, cb */) {

}

Record.prototype.drop = function(cb) {
	this.schema.dropRecord(this.id, cb);
}
