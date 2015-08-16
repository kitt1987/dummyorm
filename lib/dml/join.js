'use strict';

var _ = require('lodash');

exports.makeJoinable = function(obj) {
	_.forEach(['INNER', 'LEFt', 'RIGHT'], function(j) {
		var fn = j === 'INNER' ? 'join' : j.toLowerCase() + 'Join';
		obj[fn] = function(schema, condition) {
			if (this._join) {
				this._join += ' ' + j + ' JOIN ' + schema.tableName + ' on ' + condition;
			} else {
				this._join = j + ' JOIN ' + schema.tableName + ' on ' + condition;
			}

			if (this._table && _.isArray(this._table)) {
				this._table.push(schema.tableName);
			}

			if (this._select) {
				_.forEach(schema.columns, function(column) {
					self._select.push(column.sqlName);
				}.bind(this));
			}

			return this;
		}
	});
}
