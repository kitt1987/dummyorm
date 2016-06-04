'use strict';

var u = require('./utility');
var Record = require('./record');
var datatype = require('./ddl/datatype');
var DML = require('./dml');
const _ = require('lodash');
var Query = require('./dml/query');

class Schema extends DML {
  constructor(connector, tableName, properties, options) {
    super(connector);
    if (!tableName) throw Error('You should set table name');
    this.tableName = tableName;
    this.options = options;
    this.pending = [];
    this.column = {};
    this.fks = [];
    this._(createTable, tableName, u.toArray(properties), options);
  }

  static get Column() {
    return SchemaColumn;
  }

  static get $() {
    return $;
  }

  setSchemaFinder(schemaFinder) {
    this.schemaFinder = schemaFinder;
  }

  foreignKeys() {
    return this.fks;
  }

  getColumnName() {
    return Object.keys(this.column);
  }

  getAllColumns() {
    return Object.keys(this.column).map((c) => this.column[c]);
  }

  addColumn(columnProperties) {
    var columns = u.toArray(columnProperties);
    var add = {
      type: 'addColumns',
    };

    add.data = columns.map(this._bind(defineColumn));
    this.pending.push(add);
    return add.data;
  }

  dropColumn(columnName) {
    var columns = u.toArray(columnName);
    var drop = {
      type: 'dropColumns',
    };
    drop.data = columns.map(this._bind(deleteColumn));
    this.pending.push(drop);
  }

  modifyColumn(columnProperties) {
    var columns = u.toArray(columnProperties);
    var modify = {
      type: 'modifyColumns',
    };
    modify.data = columns.map(this._bind(editColumn));
    this.pending.push(modify);
  }

  addFullTextColumn(columnName) {
    var columns = u.toArray(columnName);
    var fulltext = {
      type: 'addFullTextColumns',
    };

    fulltext.data = columns;
    this.pending.push(fulltext);
  }

  buildIndex(indexProperties) {
    var indecies = u.toArray(indexProperties);
    var addIndex = {
      type: 'addIndicies'
    };

    addIndex.data = indecies;
    this.pending.push(addIndex);
  }

  dropIndex(indexName) {
    var indecies = u.toArray(indexName);
    var dropIndex = {
      type: 'dropIndices',
    };

    dropIndex.data = indecies;
    this.pending.push(dropIndex);
  }

  referTo(schema) {
    var fks = u.toArray(schema);
    var addFK = {
      type: 'addForeignKey',
    };

    addFK.data = this.addColumn(fks.map((fk) => {
      return {
        schemaReferred: fk,
        type: datatype.ForeignKey
      };
    }));

    this.pending.push(addFK);
  }

  dropRelation(schema) {
    var fks = u.toArray(schema);
    var dropFK = {
      type: 'dropForeignKey',
    };

    dropFK.data = fks.map((fk) => {
      return this._(deleteColumn, fk.tableName);
    });

    this.pending.push(dropFK);
  }

  getPending() {
    var pending = this.pending;
    this.pending = [];
    return pending;
  }

  create() { /* properties */
    if (!arguments)
      throw new Error(
        'ORM try to create an empty record of ' + this.tableName
      );

    var props = {},
      columns = {};
    Array.prototype.forEach.call(arguments,
      (prop) => Object.assign(props, prop));

    _.forIn(this.column, (column) => {
      var v = props[column.name];
      if (v === undefined) return;

      if (v !== null) {
        if (column.type === datatype.ForeignKey) {
          validateForeignKey(v);
        } else {
          if (column.type.js === 'boolean') {
            v = !!v;
          } else if (typeof v !== column.type.js) {
            throw new Error('Value of ' + this.tableName + ':' + column.name +
              ' should be ' + column.type.js + ', but which value is ' + v +
              ' and its type is ' + typeof v);
          }
        }
      }

      columns[column.name] = v;
    });

    return new Record(this, columns);
  }

  build(dbRecord) {
    var props = {};
    var values = dbRecord[this.tableName];
    if (!values) return null;

    _.forIn(this.column, (column) => {
      var v;
      if (column.type === datatype.ForeignKey) {
        const schemaReferred = this.schemaFinder(column.schemaReferred);
        if (!schemaReferred)
          throw new Error('Schema ' + column.schemaReferred + ' not found');
        v = schemaReferred.build(dbRecord);
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
  }

  getPendingColumns(record) {
    var pending = {};
    var pendingColumns = record.pendingColumns;
    record.pendingColumns = {};
    _.forIn(pendingColumns, (v, k) => {
      if (v === undefined || v === 'function') return;

      var column = this.column[k];
      if (v === null) {
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
          v = '\'' + v.replace('\'', '\\\'') + '\'';
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
    });

    return pending;
  }

  toJSON(record) {
    var dump = {};
    Object.keys(record).forIn((v, k) => {
      if (typeof this[k] === 'function') return;

      var column = this.column[k];
      if (column && column.type === datatype.ForeignKey) {
        validateForeignKey(v);
        const fkSchema = this.schemaFinder(v.schemaName);
        dump[k] = fkSchema.toJSON(v);
      } else if (column && column.type === datatype.JSON) {
        dump[k] = JSON.stringify(v);
      } else {
        dump[k] = v;
      }
    });

    return dump;
  }

  save(record) {
    record[datatype.UpdateTsField] = Date.now();
    return super.save(this, record);
  }

  update(record) {
    record[datatype.UpdateTsField] = Date.now();
    return super.update(this, record);
  }

  del(record) {
    return super.del(this, record);
  }

  query() { /* conditions */
    if (arguments.length > 0) {
      return Query.prototype.where.apply(super.query(this, $), arguments);
    }

    return super.query(this, $);
  }
}

function validateForeignKey(value) {
  if (!(value instanceof Record)) {
    throw new Error(
      'The value you assigned to a foreign key must be a Record.But it is ' +
      value);
  }
}

function newColumn(schema, properties) {
  var c = new Schema.Column(schema, properties);
  schema.column[c.name] = c;
  if (c.isForeignKey()) schema.fks.push(c);
  if (schema[c.name]) throw new Error();
  Object.defineProperty(schema, c.name, {
    configurable: true,
    value: schema.column[c.name]
  });

  return c;
}

function defineColumn(column) {
  if (this.column[column.name])
    throw new Error('Duplicate columns:' + column.name);
  return newColumn(this, column);
}

function editColumn(column) {
  if (!this.column[column.name]) throw new Error('No column:' + column.name);
  return newColumn(this, column);
}

function deleteColumn(columnName) {
  var column = this.column[columnName];
  if (!column) throw new Error('No column:' + columnName);
  delete this.column[columnName];
  delete this[columnName];
  return column;
}

function createTable(tableName, columns, options) {
  var create = {
    type: 'createTable',
    data: {
      table: tableName,
      options: options,
      columns: columns.map(this._bind(defineColumn)),
    }
  };

  this.pending.push(create);
}

function _expandString(str) {
  return _.padRight(str, str.length + 1);
}

function $() { /* columns and conditions */
  var sql = '';
  var close = '';
  var i = 0;
  while (i < arguments.length) {
    var v = arguments[i];
    if (v instanceof Schema.Column) {
      sql += _expandString(v.queryName);
      if (v.type.js === 'string') {
        var op = arguments[i + 1];
        if (op) {
          i += 1;
          sql += _expandString(op);
          if (op === '=') {
            close = '\'';
            sql += close;
          }
        }
      }
    } else if (v instanceof Schema) {
      sql += _expandString(v.tableName);
    } else {
      if (typeof v === 'string') {
        sql += v.replace('\'', '\\\'');
      } else {
        sql += v;
      }

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

class SchemaColumn {
  constructor(schema, properties) {
    Object.assign(this, properties);
    if (this.type === datatype.ForeignKey) {
      if (!this.schemaReferred)
        throw new Error('You have to set schema which is referred.');
      this.name = this.schemaReferred.tableName;
      this.fkName = 'fk_' + schema.tableName + '_' +
        this.schemaReferred.tableName;
      this.sqlName = 'refer_to_' + this.schemaReferred.tableName;
      this.refers = this.schemaReferred.id;
      this.schemaReferred = this.schemaReferred.tableName;
    } else {
      this.sqlName = this.name;
    }

    this.queryName = schema.tableName + '.' + this.sqlName;
    this.schema = schema.tableName;
  }

  isForeignKey() {
    return this.type === datatype.ForeignKey;
  }
}

exports = module.exports = Schema;
