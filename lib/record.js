'use strict'

var _ = require('lodash');
var util = require('util');
var datatype = require('./ddl/datatype');

exports = module.exports = Record;

function Record(schema, props) {
  this.schema = schema;
  _.forEach(this.schema.columns, function(column) {
    var v = props[column.name];
    if (_.isUndefined(v))
      return;

    if (column.type === datatype.ForeignKey) {
      if (!(v instanceof Record)) {
        throw new Error('The value assigned to a foreign key must be a Record');
      }
    } else {
      if (column.type.js === 'boolean') {
        v = !!v;
      } else if (typeof v !== column.type.js) {
        throw new Error('Data types are mismatched in schema ' +
          util.inspect(this.schema) + ', which value type is ' +
          typeof v);
      }
    }

    this[column.name] = v;
  }.bind(this));
}

// exports.prototype.set = function(properties) {
// 	_.forOwn(properties, _defineField.bind(this));
// };

exports.prototype.drop = function(fields) {
  _.forIn(fields, function(field) {
    if (!this[field])
      throw new Error('The column you want to drop is not exist, which is ' + field);
    this.delete(field);
  });
};

exports.prototype.getPending = function() {
  var fields = _.filter(_.keys(this), function(k) {
    return k != 'schema' && typeof this[k] != 'function'
  }.bind(this));

  var pending = {};
  _.forIn(fields, function(k) {
		var v = this[k];
		var column = this.schema[k];
		if (_.isNull(v)) {
			pending[column.sqlName] = 'NULL';
			return;
		}

    if (column.type === datatype.ForeignKey) {
			if (! v instanceof Record) {
				throw new Error('Foreign key must be an instance of Record');
			}

      pending[column.sqlName] = v.id;
      return;
    }

    switch (column.type.js) {
      case 'string':
        v = '\'' + v + '\'';
        break;

      case 'boolean':
        v = v ? 1 : 0;
        break;

      default:
        break;
    }

		pending[column.sqlName] = v;
  }.bind(this));
  return pending;
};

exports.prototype.getValue = function() {
  var pending = {};
  _.forIn(this, function(v, k) {
    if (k != 'schema' && typeof this[k] != 'function') {
      if (this.schema[k].type === datatype.ForeignKey && typeof v !== 'number') {
        pending[k] = v.id;
      } else {
        pending[k] = v;
      }
    }
  }.bind(this));

  return pending;
};

exports.prototype.dump = function() {
  return JSON.stringify(this.getValue());
};
