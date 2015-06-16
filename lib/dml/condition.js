'use strict'

var util = require('util');
var _ = require('lodash');

exports = module.exports = function() {
	this.sql = '';
}

// Conditions
exports.prototype.and = function(/* multiple arguments */) {
	var expanded = _.map(arguments, function(c) {
		if (typeof c !== 'object')
			throw new Error('The object must be Condition');
		return c.sql;
	});

	if (this.sql)
		this.sql += ' AND ';
	this.sql += '(' + expanded.join(' AND ') + ')';
	return this;
}

exports.prototype.or = function(/* multiple arguments */) {
	var expanded = _.map(arguments, function(c) {
		if (typeof c !== 'object')
			throw new Error('The object must be Condition');
		return c.sql;
	});

	if (this.sql)
		this.sql += ' OR ';
	this.sql += '(' + expanded.join(' OR ') + ')';
	return this;
}

function _numberOrStringOrBoolValue(v) {
	if (_.isNumber(v))
		return v;

	if (_.isString(v))
		return '\'' + v + '\'';

	if (typeof n !== 'object' || !n.type ||
		(n.type.js !== 'number' && n.type.js !== 'string'))
		throw new Error('This op just applies to number, but which is ' +
			util.inspect(n));

	return n.schema.tableName + '.' + n.name;
}

function _numberOrStringOrBoolKey(v) {
	if (_.isNumber(v))
		return v;

	if (_.isString(v))
		return v;

	if (typeof n !== 'object' || !n.type ||
		(n.type.js !== 'number' && n.type.js !== 'string'))
		throw new Error('This op just applies to number, but which is ' +
			util.inspect(n));

	return n.schema.tableName + '.' + n.name;
}

function _isStringField(s) {
	return _.isString(s) || (typeof s === 'object' && s.type && s.type.js === 'string');
}

function _buildRelation(a, b, op) {
	this.sql += util.format('%s%s%s', _numberOrStringOrBoolKey(a), op,
		_numberOrStringOrBoolValue(b));
}

// Columns which type is number or string
exports.prototype.eq = function(a, b) {
	_buildRelation.bind(this)(a, b, '=');
	return this;
}

exports.prototype.neq = function(a, b) {
	_buildRelation.bind(this)(a, b, '<>');
	return this;
}

function _numberValue(n) {
	if (_.isNumber(n))
		return n;

	if (typeof n !== 'object' || !n.type || n.type.js !== 'number')
		throw new Error('This op just applies to number, but which is ' +
			util.inspect(n));

	return n.schema.tableName + '.' + n.name;
}

function _buildNumberRelation(a, b, op) {
	this.sql += util.format('%s%s%s', _numberValue(a), op, _numberValue(b));
}

// Columns which type is number or numbers
exports.prototype.gt = function(a, b) {
	_buildNumberRelation.bind(this)(a, b, '>');
	return this;
}

exports.prototype.ge = function(a, b) {
	_buildNumberRelation.bind(this)(a, b, '>=');
	return this;
}

exports.prototype.lt = function(a, b) {
	_buildNumberRelation.bind(this)(a, b, '<');
	return this;
}

exports.prototype.le = function(a, b) {
	_buildNumberRelation.bind(this)(a, b, '<=');
	return this;
}