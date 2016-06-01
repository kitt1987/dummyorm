'use strict';

var u = require('./utility');
var Record = require('./record');
var datatype = require('./ddl/datatype');

exports = module.exports = Schema;

function Schema(tableName, properties, options) {
  if (!tableName) throw Error('You should set table name');
  this.tableName = tableName;
  this.keyOfAll = 'all' + tableName + 's';
  this.keyOfEntry = tableName;
  this.options = options;
  this.pending = {};
  this.columns = {};
  this.fks = [];
  _createTable.bind(this)(tableName, u.toArray(properties), options);
}

Schema.Column = SchemaColumn;

function SchemaColumn(schema, properties) {
  Object.assign(this, properties);
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
  if (c.isForeignKey()) schema.fks.push(c);
  return c;
}

function defineColumn(schema, column) {
  if (schema[column.name]) throw new Error('Duplicate columns:' + column.name);
  return newColumn(schema, column);
}

function modifyColumn(schema, column) {
  if (!schema[column.name]) throw new Error('No column:' + column.name);
  return newColumn(schema, column);
}

function dropColumn(schema, columnName) {
  var column = schema[columnName];
  if (!column) throw new Error('No column:' + columnName);
  delete schema[columnName];
  delete schema.columns[columnName];
  return column;
}

function _createTable(tableName, columns, options) {
  this.pending.create = this.pending.create || {};
  this.pending.create.table = tableName;
  this.pending.create.options = options;
  this.pending.create.column = columns.map(defineColumn.bind(null, this));
}

Schema.prototype.foreignKeys = function() {
  return this.fks;
};

Schema.prototype.getColumns = function() {
  return Object.keys(this.columns).filter(
    (c) => c !== 'id' && c !== 'update_ts'
  );
};

Schema.prototype.addColumn = function(columnProperties) {
  var columns = u.toArray(columnProperties);
  this.pending.add = this.pending.add || [];
  var newColumns = columns.map(defineColumn.bind(null, this));
  this.pending.add = this.pending.add.concat(newColumns);
  return newColumns;
};

Schema.prototype.dropColumn = function(columnName) {
  var columns = u.toArray(columnName);
  this.pending.drop = this.pending.drop || [];
  this.pending.drop = this.pending.drop.concat(columns.map(
    dropColumn.bind(null, this)));
};

Schema.prototype.modifyColumn = function(columnProperties) {
  var columns = u.toArray(columnProperties);
  this.pending.modify = this.pending.modify || [];
  this.pending.modify = this.pending.modify.concat(columns.map(
    modifyColumn.bind(null, this)));
};

Schema.prototype.addFullTextColumn = function(columnName) {
  var columns = u.toArray(columnName);
  this.pending.addFullText = this.pending.addFullText || [];
  this.pending.addFullText = this.pending.addFullText.concat(columns);
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
  this.pending.addFK = this.addColumn(fks.map((fk) => {
    return {
      schemaReferred: fk,
      fkName: 'fk_' + this.tableName + '_' + fk.tableName,
      type: datatype.ForeignKey
    };
  }));
};

Schema.prototype.dropRelation = function(schema) {
  var fks = u.toArray(schema);
  this.pending.dropFK = fks.map((fk) => {
    return dropColumn(this, fk.tableName);
  });
};

Schema.prototype.getPending = function() {
  var pending = this.pending;
  this.pending = {};
  return pending;
};

Schema.prototype.create = function() { /* properties */
  return new Record(this, arguments);
};

Schema.prototype.build = function(dbRecord) {
  var props = {};
  var values = dbRecord[this.tableName];
  if (!values) return null;

  this.columns.forEach((column) => {
    var v;
    if (column.type === datatype.ForeignKey) {
      v = column.schemaReferred.build(dbRecord);
    } else if (column.type === datatype.JSON && values[column.name]) {
      v = values[column.name].replace(/^"(.+)"$/, '$1');
      v = JSON.parse(v);
    } else {
      v = values[column.name];
    }

    if (v === null) return;
    props[column.name] = v;
  });

  if (Object.keys(props).length === 0) return null;
  return this.create(props);
};
