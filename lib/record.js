'use strict';

var _ = require('lodash');
var util = require('util');
var datatype = require('./ddl/datatype');

exports = module.exports = Record;

function Record(schema, props) {
  this.schema = schema;
  if (_.isUndefined(props)) {
    throw new Error('ORM try to create an empty record of ' + this.schema.tableName);
  }

  var $_$ = {};
  _.forEach(props, function(prop) {
    _.assign($_$, prop);
  });

  props = $_$;
  _.forEach(this.schema.columns, function(column) {
    var v = props[column.name];
    if (v === undefined)
      return;

    if (v !== null) {
      if (column.type === datatype.ForeignKey) {
        validateForeignKey(v);
      } else {
        if (column.type.js === 'boolean') {
          v = !!v;
        } else if (typeof v !== column.type.js) {
          throw new Error('Value of ' + schema.tableName + ':' + column.name + ' should be '
            + column.type.js + ', but which value is ' + v + ' and its type is '
            + typeof v);
        }
      }
    }

    this[column.name] = v;
  }.bind(this));
}

// exports.prototype.set = function(properties) {
// 	_.forOwn(properties, _defineField.bind(this));
// };

function validateForeignKey(value) {
  if (!(value instanceof Record)) {
    throw new Error('The value you assigned to a foreign key must be a Record.'
      + 'Now it is ' + value);
  }
}

exports.prototype.drop = function(fields) {
  _.forIn(fields, function(field) {
    if (!this[field])
      throw new Error('The column you want to drop is not exist, which is ' + field);
    this.delete(field);
  });
};

exports.prototype.getPending = function() {
  var pending = {};
  _.forIn(this, function(v, k) {
    if (k === 'schema' || typeof this[k] === 'function')
      return;

    if (v === undefined)
      return;

    var column = this.schema[k];
    if (_.isNull(v)) {
      pending[column.sqlName] = 'NULL';
      return;
    }

    if (column.type === datatype.ForeignKey) {
      validateForeignKey(v);
      pending[column.sqlName] = v.id;
      return;
    }

    switch (column.type.js) {
      case 'string':
        v = '\'' + v + '\'';
        break;

      case 'object':
        v = '\'' + JSON.stringify(v) + '\'';
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

exports.prototype.dump = function() {
  var dump = {};
  _.forIn(this, function(v, k) {
    if (k === 'schema' || typeof this[k] === 'function')
      return;

    var column = this.schema[k];
    if (!column)
      throw new Error('No column named ' + k + ' in ' + this.schema.tableName);

    if (column.type === datatype.ForeignKey) {
      validateForeignKey(v);
      dump[k] = v.id;
    } else {
      dump[k] = v;
    }
  }.bind(this));

  return dump;
};

exports.prototype.outline = function() {
  var dump = {};
  _.forIn(this, function(v, k) {
    if (k === 'schema' || typeof this[k] === 'function')
      return;

    var column = this.schema[k];
    if (column && column.type === datatype.ForeignKey) {
      validateForeignKey(v);
      dump[k] = v.outline();
    } else {
      dump[k] = v;
    }
  }.bind(this));

  if (this.schema.onRender && typeof this.schema.onRender === 'function') {
    this.schema.onRender(dump);
  }
  return dump;
};
