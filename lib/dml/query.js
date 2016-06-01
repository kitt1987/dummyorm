'use strict';

var _ = require('lodash');
var Join = require('./join');
var util = require('util');
var $ = require('./condition').$;

exports = module.exports = Query;

function Query(orm, schema) {
  this.orm = orm;
  this.schema = schema;
  this._table = [];
  this._select = '*';
  this._table.push(schema.tableName);
  this.dataParser = parseDbRecord;
  // if (schemas) {
  //   this._table = _.map(schemas, 'tableName');
  //   this._select = _.flatten(_.map(schemas, function(schema) {
  //     return _.map(schema.columns, function(column) {
  //       return column.sqlName;
  //     });
  //   }));
  // }
}

function joinForeignKey(query, schema) {
  schema.columns.forEach((column) => {
    if (column.isForeignKey()) {
      if (query._leftJoinAll) {
        query.leftJoin(column.schemaReferred,
          $(column, '=', column.schemaReferred.id));
      } else {
        query.join(column.schemaReferred,
          $(column, '=', column.schemaReferred.id));
      }

      joinForeignKey(query, column.schemaReferred);
    }
  });
}

function parseDbRecord(schema, results) {
  return results.map((r) => schema.build(r));
}

// Query.prototype.select = function( /* multiple columns */ ) {
//   if (arguments.length === 1 && typeof arguments[0] === 'string') {
//     this._select.push(arguments[0]);
//     return this;
//   }
//
//   var self = this;
//   _.forIn(arguments, function(c) {
//     self._select.push(c.sqlName);
//     self._table.push(c.schema.tableName);
//   });
//   return this;
// }

// function parseCount(schema, results) {
//   return results[0].count;
// }
//
// Query.prototype.count = function() {
//   this._select = $('COUNT(', this.schema.id, ') AS count');
//   this.dataParser = parseCount;
//   return this;
// };

// Query.prototype.union = function(stringOrQuery) {
//   if (typeof stringOrQuery === 'string') {
//     this._union = stringOrQuer;
//     return this;
//   }
//
//   this._union = normaliseQuery(stringOrQuery);
//   return this;
// }
//
// Query.prototype.function = function(func) {
//   this._select = func;
// }

Join.makeJoinable(Query.prototype);

Query.prototype.cacheSingle = function(key, life) {
  this._cacheSingle = key;
  this._cacheLife = life;
  return this;
};

Query.prototype.cacheArray = function(key, life) {
  this._cacheArray = key;
  this._cacheLife = life;
  return this;
};

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
};

Query.prototype.joinAll = function() {
  this._leftJoinAll = true;
  return this;
};

function normaliseQuery(query) {
  if (query._select.length === 0 || query._table.length === 0) {
    throw new Error(
      'You should call orm.query(Schema) or orm.query().select(Schema.Column)'
    );
  }

  var sql = util.format('SELECT %s FROM %s', query._select,
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

Query.prototype.exec = function() {
  if (!this._join) joinForeignKey(this, this.schema);

  this.orm.storage.performSQL(normaliseQuery(this))
    .then((results) => {
      if (results && results.length === 0) {
        return this.dataParser(this.schema, results);
      }
    });
};
