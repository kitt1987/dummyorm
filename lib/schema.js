'use strict'

var _ = require('lodash');
var u = require('./utility');
var async = require('async');
var Record = require('./record');

exports = module.exports = function(tableName, properties) {
	if (!tableName)
		throw Error('You should set table name');

	this.tableName = tableName;
	this.pending = {};
	_createTable.bind(this)(tableName, u.arrayWrapped(properties));
}

function _defineColumn(column) {
	if (this[column.name])
		throw new Error('Duplicate columns');
	column.schema = this;
	this[column.name] = column;
}

function _modifyColumn(column) {
	if (!this[column.name])
		throw new Error('No column');
	this[column.name] = column;
}

function _createTable(tableName, columns) {
	this.pending['create'] = this.pending['create'] || {};
	this.pending['create'].table = this.tableName;
	this.pending['create'].column = columns;
	_.map(this.pending['create'].column, _defineColumn.bind(this));
}

exports.prototype.addColumn = function(columnProperties) {
	var columns = u.arrayWrapped(columnProperties);
	this.pending['add'] = this.pending['add'] || [];
	this.pending['add'] = this.pending['add'].concat(columns);
	_defineColumn.bind(this)(columns);
}

exports.prototype.dropColumn = function(columnName) {
	var columns = u.arrayWrapped(columnName);
	this.pending['drop'] = this.pending['drop'] || [];
	this.pending['drop'] = this.pending['drop'].concat(columns);
}

exports.prototype.modifyColumn = function(columnProperties) {
	var columns = u.arrayWrapped(columnProperties);
	this.pending['modify'] = this.pending['modify'] || [];
	this.pending['modify'] = this.pending['modify'].concat(columns);
	_modifyColumn.bind(this)(columns);
}

exports.prototype.buildIndex = function(indexProperties) {
	var indecies = u.arrayWrapped(indexProperties);
	this.pending['addIndex'] = this.pending['addIndex'] || [];
	this.pending['addIndex'] = this.pending['addIndex'].concat(indecies);
}

exports.prototype.dropIndex = function(indexName) {
	var indecies = u.arrayWrapped(indexName);
	this.pending['dropIndex'] = this.pending['dropIndex'] || [];
	this.pending['dropIndex'] = this.pending['dropIndex'].concat(indecies);
}

exports.prototype.contains = function(schema) {
	var fk = u.arrayWrapped(schema);
	this.pending['addFK'] = fk;
}

exports.prototype.dropRelation = function(schema) {
	var fk = u.arrayWrapped(schema);
	this.pending['dropFK'] = fk;
}

exports.prototype.getPending = function() {
	var pending = this.pending;
	this.pending = {};
	return pending;
}

exports.prototype.create = function(properties) {
	return new Record(this, properties);
}

exports.prototype.parseRecord = function(dumpText) {
	return new Record(this, JSON.parse(dumpText));
}
