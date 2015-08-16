'use strict';

var u = require('../utility');
var _ = require('lodash');

exports.makeJoinable = function(obj) {
	_.forEach(['INNER', 'LEFt', 'RIGHT'], function(j) {
		var fn = j === 'INNER' ? 'join' : j.toLowerCase() + 'Join';
		obj[fn] = function(schema, condition) {
			if (!condition) {
				condition = this.schema[schema.tableName].queryName + '=' + schema.id.queryName;
			}

			if (this._join) {
				this._join += ' ' + j + ' JOIN ' + schema.tableName + ' on ' + condition;
			} else {
				this._join = j + ' JOIN ' + schema.tableName + ' on ' + condition;
			}

			return this;
		}
	});
}
