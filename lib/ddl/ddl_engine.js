'use strict'

exports = module.exports = function(engine) {
	this.engine = engine;
}

exports.prototype.performSQL = function(sql, cb) {
	this.engine.performSQL(sql, cb);
}

function _createTable(createObj, acb) {

}

function _addColumns(addColumnObj, acb) {

}

function _modifyColumns(modifyObj, acb) {

}

function _dropColumns(dropColumnObj, acb) {

}

function _addIndices(addIndexObj, acb) {

}

function _dropIndices(dropIndexObj, acb) {

}

exports.prototype.syncSchema = function(schema, cb) {
	var pending = schema.getPending();
	var create = pending.create;
	var add = pending.add
	var modify = pending.modify;
	var drop = pending.drop;
	var addIndex = pending.addIndex;
	var dropIndex = pending.dropIndex;

	if (create)
		_createTable.bind(this)(create);

	if (add)
		_addColumns.bind(this)(add);

	if (modify)
		_modifyColumns.bind(this)(modify);

	if (drop)
		_dropColumns.bind(this)(drop);

	if (addIndex)
		_addIndices.bind(this)(addIndex);

	if (dropIndex)
		_dropIndices.bind(this)(dropIndex);

	cb(null, schema);
}