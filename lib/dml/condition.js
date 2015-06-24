'use strict'

var util = require('util');
var _ = require('lodash');
var Schema = require('../schema');

exports = module.exports = function() {
	this.sql = '';
}

// $(column, 'AND', value) || $(column, '=', a)
// $('NOT', column)
// $($(abcd), 'AND', $(efgh))
// $($(abcd), 'AND', $(efgh), 'AND(', ')')
// $(column, 'AND(', column, '=0)')
// $(stringColumn, '=', somestringVariable) => stringColumn=\'somestringVariable\'
// $(stringColumn, '=', 'abcd') => stringColumn=\'abcd\'
// $(stringColumn, '=', '(', column, '>0)') => stringColumn=\'abcd\'
// $(stringColumn, '=\'abcd\'', 'AND 1=1', ) => stringColumn=\'abcd\ AND 1=1'

function _expandString(str) {
	return _.padRight(str, str.length + 1);
}

exports.$ = function( /* columns and conditions */ ) {
	var sql = '';
	var close = '';
	var i = 0;
	while (i < arguments.length) {
		var v = arguments[i];
		if (v instanceof Schema.Column) {
			sql += _expandString(v.name);
			if (v.type.js === 'string') {
				i += 1;
				var op = arguments[i];
				sql += _expandString(op);
				if (op === '=') {
					close = '\''
					sql += close;
				}
			}
		} else {
			sql += v;
			if (close) {
				sql += close;
				close = '';
			}
			sql = _.padRight(sql, sql.length + 1);
		}
		i += 1;
	}

	return sql;
}

// Conditions
exports.prototype.and = function( /* multiple arguments */ ) {
	if (this.sql)
		this.sql += ' AND ';

	if (arguments.length == 0)
		return this;

	var expanded = _.map(arguments, function(c) {
		if (typeof c !== 'object')
			throw new Error('The object must be Condition');
		return c.sql;
	});

	this.sql += '(' + expanded.join(' AND ') + ')';
	return this;
}

exports.prototype.or = function( /* multiple arguments */ ) {
	if (this.sql)
		this.sql += ' OR ';

	if (arguments.length == 0)
		return this;

	var expanded = _.map(arguments, function(c) {
		if (typeof c !== 'object')
			throw new Error('The object must be Condition');
		return c.sql;
	});

	this.sql += expanded.join(' OR ');
	return this;
}

function _numberOrStringOrBoolValue(v) {
	if (_.isNumber(v))
		return v;

	if (_.isString(v))
		return '\'' + v + '\'';

	if (typeof v !== 'object' || !v.type ||
		(v.type.js !== 'number' && v.type.js !== 'string'))
		throw new Error('This op just applies to number, but which is ' +
			util.inspect(v));

	return v.schema.tableName + '.' + v.name;
}

function _numberOrStringOrBoolKey(v) {
	if (_.isNumber(v))
		return v;

	if (_.isString(v))
		return v;

	if (typeof v !== 'object' || !v.type ||
		(v.type.js !== 'number' && v.type.js !== 'string'))
		throw new Error('This op just applies to number, but which is ' +
			util.inspect(v));

	return v.schema.tableName + '.' + v.name;
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