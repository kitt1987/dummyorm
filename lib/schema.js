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
    this.pending = {};
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
    return Object.keys(this.column).filter(
      (c) => c !== 'id' && c !== 'update_ts'
    );
  }

  getAllColumns() {
    return Object.keys(this.column).filter(
      (c) => c !== 'id' && c !== 'update_ts'
    ).map((c) => this.column[c]);
  }

  addColumn(columnProperties) {
    var columns = u.toArray(columnProperties);
    this.pending.add = this.pending.add || [];
    var newColumns = columns.map(this._bind(defineColumn));
    this.pending.add = this.pending.add.concat(newColumns);
    return newColumns;
  }

  dropColumn(columnName) {
    var columns = u.toArray(columnName);
    this.pending.drop = this.pending.drop || [];
    this.pending.drop = this.pending.drop.concat(columns.map(
      this._bind(deleteColumn)));
  }

  modifyColumn(columnProperties) {
    var columns = u.toArray(columnProperties);
    this.pending.modify = this.pending.modify || [];
    this.pending.modify = this.pending.modify.concat(columns.map(
      this._bind(editColumn)));
  }

  addFullTextColumn(columnName) {
    var columns = u.toArray(columnName);
    this.pending.addFullText = this.pending.addFullText || [];
    this.pending.addFullText = this.pending.addFullText.concat(columns);
  }

  buildIndex(indexProperties) {
    var indecies = u.toArray(indexProperties);
    this.pending.addIndex = this.pending.addIndex || [];
    this.pending.addIndex = this.pending.addIndex.concat(indecies);
  }

  dropIndex(indexName) {
    var indecies = u.toArray(indexName);
    this.pending.dropIndex = this.pending.dropIndex || [];
    this.pending.dropIndex = this.pending.dropIndex.concat(indecies);
  }

  referTo(schema) {
    var fks = u.toArray(schema);
    this.pending.addFK = this.addColumn(fks.map((fk) => {
      return {
        schemaReferred: fk,
        type: datatype.ForeignKey
      };
    }));
  }

  dropRelation(schema) {
    var fks = u.toArray(schema);
    this.pending.dropFK = fks.map((fk) => {
      return this._(deleteColumn, fk.tableName);
    });
  }

  getPending() {
    var pending = this.pending;
    this.pending = {};
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
        // FIXME column.schemaReferred is just a table name now.
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
    _.forIn(record, (v, k) => {
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
    });

    return pending;
  }

  outline(record) {
    var dump = {};
    Object.keys(record).forIn((v, k) => {
      if (typeof this[k] === 'function') return;

      var column = this.column[k];
      if (column && column.type === datatype.ForeignKey) {
        validateForeignKey(v);
        const fkSchema = this.schemaFinder(v.schemaName);
        dump[k] = fkSchema.outline(v);
      } else if (column && column.type === datatype.JSON) {
        dump[k] = JSON.stringify(v);
      } else {
        dump[k] = v;
      }
    });

    // FIXME!!
    // if (this.schema.onRender && typeof this.schema.onRender === 'function')
    //   this.schema.onRender(dump);

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
  this.pending.create = this.pending.create || {};
  this.pending.create.table = tableName;
  this.pending.create.options = options;
  this.pending.create.column = columns.map(this._bind(defineColumn));
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

class SchemaColumn {
  constructor(schema, properties) {
    // FIXME fix schema object within property
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
