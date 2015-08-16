'use strict';

var _ = require('lodash');
var u = require('./utility');
var async = require('async');
var Record = require('./record');
var datatype = require('./ddl/datatype');

exports = module.exports = Schema;

function Schema(tableName, properties, options) {
	if (!tableName)
		throw Error('You should set table name');

	this.tableName = tableName;
	this.options = options;
	this.pending = {};
	this.columns = {};
	_createTable.bind(this)(tableName, u.toArray(properties), options);
};

Schema.Column = SchemaColumn;

function SchemaColumn(schema, properties) {
	_.assign(this, properties);
	this.schema = schema;
	this.sqlName = schema.tableName + '.' + this.name;
}

function newColumn(schema, properties) {
	var c = new Schema.Column(schema, properties);
	schema[c.name] = c;
	schema.columns[c.name] = c;
}

function defineColumn(schema, column) {
	if (schema[column.name])
		throw new Error('Duplicate columns:' + column.name);
	newColumn(schema, column);
}

function modifyColumn(schema, column) {
	if (!schema[column.name])
		throw new Error('No column:' + column.name);
	newColumn(schema, column);
}

function dropColumn(schema, columnName) {
	if (!schema[columnName])
		throw new Error('No column:' + columnName);
	delete schema[columnName];
	delete schema.columns[columnName];
}

function _createTable(tableName, columns, options) {
	this.pending.create = this.pending.create || {};
	this.pending.create.table = tableName;
	this.pending.create.column = columns;
	this.pending.create.options = options;
	_.map(this.pending.create.column, defineColumn.bind(null, this));
}

Schema.prototype.addColumn = function(columnProperties) {
	var columns = u.toArray(columnProperties);
	this.pending.add = this.pending.add || [];
	this.pending.add = this.pending.add.concat(columns);
	_.map(columns, defineColumn.bind(null, this));
};

Schema.prototype.dropColumn = function(columnName) {
	var columns = u.toArray(columnName);
	this.pending.drop = this.pending.drop || [];
	this.pending.drop = this.pending.drop.concat(columns);
	_.map(columns, dropColumn.bind(null, this));
};

Schema.prototype.modifyColumn = function(columnProperties) {
	var columns = u.toArray(columnProperties);
	this.pending.modify = this.pending.modify || [];
	this.pending.modify = this.pending.modify.concat(columns);
	_.map(columns, modifyColumn.bind(null, this));
};

Schema.prototype.buildIndex = function(indexProperties) {
	var indecies = u.toArray(indexProperties);
	this.pending.addIndex = this.pending.addIndex || [];
	this.pending.addIndex = this.pending.addIndex.concat(indecies);
};

Schema.prototype.dropIndex = function(indexName) {
	var indecies = u.toArray(indexName);
	this.pending.dropIndex = this.pending.dropIndex || [];
	this.pending.dropIndex = this.pending.dropIndex.concat(indecies);
};

Schema.prototype.referTo = function(schema) {
	var fks = u.toArray(schema);
	_.forEach(fks, function(fk) {
		this.addColumn({
			name: u.fkColumn(fk),
			type: datatype.ForeignKey
		});
	}.bind(this));
	this.pending.addFK = fks;
};

Schema.prototype.dropRelation = function(schema) {
	var fks = u.toArray(schema);
	_.forEach(fks, function(fk) {
		dropColumn(this, u.fkColumn(fk));
	}.bind(this));
	this.pending.dropFK = fks;
};

Schema.prototype.getPending = function() {
	var pending = this.pending;
	this.pending = {};
	return pending;
};

Schema.prototype.create = function(properties) {
	return new Record(this, properties);
};

Schema.prototype.parseRecord = function(dumpText) {
	return new Record(this, JSON.parse(dumpText));
};
