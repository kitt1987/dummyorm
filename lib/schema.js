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
}

Schema.Column = SchemaColumn;

function SchemaColumn(schema, properties) {
  _.assign(this, properties);
  this.schema = schema;
  if (this.type === datatype.ForeignKey) {
    if (!this.schemaReferred)
      throw new Error('You must define which schema referred.');
    this.name = this.schemaReferred.tableName;
    this.sqlName = 'refer_to_' + this.schemaReferred.tableName;
  } else {
    this.sqlName = this.name;
  }

  this.queryName = schema.tableName + '.' + this.sqlName;
}

SchemaColumn.prototype.isForeignKey = function() {
  return this.type === datatype.ForeignKey;
};

function newColumn(schema, properties) {
  var c = new Schema.Column(schema, properties);
  schema[c.name] = c;
  schema.columns[c.name] = c;
  return c;
}

function defineColumn(schema, column) {
  if (schema[column.name])
    throw new Error('Duplicate columns:' + column.name);
  return newColumn(schema, column);
}

function modifyColumn(schema, column) {
  if (!schema[column.name])
    throw new Error('No column:' + column.name);
  return newColumn(schema, column);
}

function dropColumn(schema, columnName) {
  var column = schema[columnName];
  if (!column)
    throw new Error('No column:' + columnName);
  delete schema[columnName];
  delete schema.columns[columnName];
  return column;
}

function _createTable(tableName, columns, options) {
  this.pending.create = this.pending.create || {};
  this.pending.create.table = tableName;
  this.pending.create.options = options;
  this.pending.create.column = _.map(columns, defineColumn.bind(null, this));
}

Schema.prototype.addColumn = function(columnProperties) {
  var columns = u.toArray(columnProperties);
  this.pending.add = this.pending.add || [];
  var newColumns = _.map(columns, defineColumn.bind(null, this));
  this.pending.add = this.pending.add.concat(newColumns);
  return newColumns;
};

Schema.prototype.dropColumn = function(columnName) {
  var columns = u.toArray(columnName);
  this.pending.drop = this.pending.drop || [];
  this.pending.drop = this.pending.drop.concat(_.map(columns,
    dropColumn.bind(null, this)));
};

Schema.prototype.modifyColumn = function(columnProperties) {
  var columns = u.toArray(columnProperties);
  this.pending.modify = this.pending.modify || [];
  this.pending.modify = this.pending.modify.concat(_.map(columns,
    modifyColumn.bind(null, this)));
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
  this.pending.addFK =
    this.addColumn(_.map(fks, function(fk) {
      return {
        schemaReferred: fk,
        fkName: 'fk_' + this.tableName + '_' + fk.tableName,
        type: datatype.ForeignKey
      };
    }.bind(this)));
};

Schema.prototype.dropRelation = function(schema) {
  var fks = u.toArray(schema);
  this.pending.dropFK = _.map(fks, function(fk) {
    return dropColumn(this, fk.tableName);
  }.bind(this));
};

Schema.prototype.getPending = function() {
  var pending = this.pending;
  this.pending = {};
  return pending;
};

Schema.prototype.create = function(/* properties */) {
  return new Record(this, arguments);
};

Schema.prototype.build = function(dbRecord) {
  var props = {};
  var values = dbRecord[this.tableName];
  _.forEach(this.columns, function(column) {
    var v;
    if (column.type === datatype.ForeignKey) {
      v = column.schemaReferred.build(dbRecord);
    } else {
      v = values[column.name];
    }

    if (_.isNull(v))
      return;

    props[column.name] = v;
  });

  if (_.keys(props).length === 0)
    return null;

  return this.create(props);
};
