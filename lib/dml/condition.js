'use strict'

var util = require('util');
var _ = require('lodash');
var Schema = require('../schema');

exports = module.exports = function() {
	this.sql = '';
}

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
			sql += _expandString(v.schema.tableName + '.' + v.name);
			if (v.type.js === 'string') {
				i += 1;
				var op = arguments[i];
				sql += _expandString(op);
				if (op === '=') {
					close = '\''
					sql += close;
				}
			}
		} else if (v instanceof Schema) {
			sql += _expandString(v.tableName);
		}
		else {
			sql += v;
			if (close) {
				sql += close;
				close = '';
			}
			sql = _expandString(sql);
		}
		i += 1;
	}

	return sql;
}
