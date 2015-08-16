'use strict';

var _ = require('lodash');
var Join = require('./join');
var util = require('util');
var logger = require('../logger');

exports = module.exports = Query;

function Query(engine, schemas) {
  this.engine = engine;
  this._table = [];
  this._select = [];
  if (schemas) {
    this._table = _.map(schemas, 'tableName');
    this._select = _.flatten(_.map(schemas, function(schema) {
      return _.map(schema.columns, function(column) {
        return column.sqlName;
      });
    }));
  }
}

Query.prototype.select = function( /* multiple columns */ ) {
  if (arguments.length === 1 && typeof arguments[0] === 'string') {
    this._select.push(arguments[0]);
    return this;
  }

  var self = this;
  _.forIn(arguments, function(c) {
    self._select.push(c.sqlName);
    self._table.push(c.schema.tableName);
  });
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
  if (typeof column === 'string') {
    this._group = column;
  } else {
    this._group = column.schema.tableName + '.' + column.name;
  }

  return this;
};

Query.prototype.orderBy = function(column) {
  if (typeof column === 'string') {
    this._order = column;
  } else {
    this._order = column.schema.tableName + '.' + column.name;
  }

  return this;
};

Query.prototype.desc = function() {
  this._desc = true;
  return this;
}

function normaliseQuery(query) {
  if (query._select.length === 0 || query._table.length === 0) {
    throw new Error('You should call orm.query(Schema) or orm.query().select(Schema.Column)');
    return;
  }

  var sql = util.format('SELECT %s FROM %s', query._select.join(','),
    _.uniq(query._table).join(','));
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
