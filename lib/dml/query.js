'use strict';

var _ = require('lodash');
var Join = require('./join');
var util = require('util');

exports = module.exports = Query;

function Query(engine, main_table) {
  this.engine = engine;
  this._select = '*';
  if (main_table)
    this._table = _.uniq(main_table).join(',');
}

Query.prototype.select = function( /* multiple columns */ ) {
  if (arguments.length === 1 && typeof arguments[0] === 'string') {
    this._select = arguments[0];
    return this;
  }

  var sel = [],
    tables = [];
  _.forIn(arguments, function(c) {
    sel.push(c.schema.tableName + '.' + c.name);
    tables.push(c.schema.tableName);
  });

  this._select = sel.join(',');
  this._table = _.uniq(tables).join(',');
  return this;
}

Query.prototype.union = function(stringOrQuery) {
  if (typeof stringOrQuery === 'string') {
    this._union = stringOrQuer;
    return this;
  }

  this._union = normaliseQuery(stringOrQuery);
  return this;
}

Query.prototype.function = function(func) {
  this._select = func;
}

Join.makeJoinable(Query.prototype);

Query.prototype.where = function(condition) {
  this._where = condition;
  return this;
};

Query.prototype.offset = function(offset) {
  this._offset = offset;
  return this;
};

Query.prototype.limit = function(limit) {
  this._limit = limit;
  return this;
};

Query.prototype.groupBy = function(column) {
  this._group = column.schema.tableName + '.' + column.name;
  return this;
};

Query.prototype.orderBy = function(column) {
  this._order = column.schema.tableName + '.' + column.name;
  return this;
};

Query.prototype.desc = function() {
  this._desc = true;
  return this;
}

function normaliseQuery(query) {
  if (!query._select || !query._table) {
    cb(new Error('You should call orm.query(Schema) or orm.query().select(Schema.Column)'));
    return;
  }

  var sql = util.format('SELECT %s FROM %s', query._select, query._table);
  if (query._join) {
    sql += ' ' + query._join;
  }

  if (query._where)
    sql += ' WHERE ' + query._where;

  if (query._union)
    sql += ' UNION ' + query._union;

  if (query._group)
    sql += ' GROUP BY ' + query._group;

  if (query._order)
    sql += ' ORDER BY ' + query._order;

  if (query._desc)
    sql += ' DESC ';

  if (query._limit)
    sql += ' LIMIT ' + query._limit;

  if (query._offset)
    sql += ' OFFSET ' + query._offset;

  return sql;
}

Query.prototype.exec = function(cb) {
  this.engine.performSQL(normaliseQuery(this), cb);
};
