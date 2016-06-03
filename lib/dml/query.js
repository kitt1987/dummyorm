'use strict';

var _ = require('lodash');
var Join = require('./join');
var util = require('util');

class Query {
  constructor(connector, schema, conditionParser) {
    this.connector = connector;
    this.schema = schema;
    this._table = [];
    this._select = '*';
    this._table.push(schema.tableName);
    this.dataParser = parseDbRecord;
    this.conditionParser = conditionParser;
    // if (schemas) {
    //   this._table = _.map(schemas, 'tableName');
    //   this._select = _.flatten(_.map(schemas, function(schema) {
    //     return _.map(schema.columns, function(column) {
    //       return column.sqlName;
    //     });
    //   }));
    // }
  }

  cacheSingle(key, life) {
    this._cacheSingle = key;
    this._cacheLife = life;
    return this;
  }

  cacheArray(key, life) {
    this._cacheArray = key;
    this._cacheLife = life;
    return this;
  }

  where() {
    this._where = this.conditionParser.apply(null, arguments);
    return this;
  }

  offset(offset) {
    this._offset = offset;
    return this;
  }

  limit(limit) {
    this._limit = limit;
    return this;
  }

  groupBy(column) {
    if (typeof column === 'string') {
      this._group = column;
    } else {
      this._group = column.queryName;
    }

    return this;
  }

  orderBy(column) {
    if (typeof column === 'string') {
      this._order = column;
    } else {
      this._order = column.queryName;
    }

    return this;
  }

  desc() {
    this._desc = true;
    return this;
  }

  joinAll() {
    this._leftJoinAll = true;
    return this;
  }

  exec() {
    if (!this._join) joinForeignKey(this, this.schema);

    return this.connector.getStorage().performSQL(normaliseQuery(this))
      .then((results) => {
        if (results && results.length > 0) {
          return this.dataParser(this.schema, results);
        }
      });
  }
}

function joinForeignKey(query, schema) {
  schema.getAllColumns().forEach((column) => {
    if (!column.isForeignKey()) return;
    var referredSchema = schema.schemaFinder(column.schemaReferred);
    if (!referredSchema)
      throw new Error('Schema ' + column.schemaReferred + ' not found');
    if (query._leftJoinAll) {
      query.leftJoin(referredSchema,
        query.conditionParser(column, '=', column.refers));
    } else {
      query.join(referredSchema,
        query.conditionParser(column, '=', column.refers));
    }

    joinForeignKey(query, referredSchema);

  });
}

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

function parseDbRecord(schema, results) {
  return results.map((r) => schema.build(r));
}

Join.makeJoinable(Query.prototype);
exports = module.exports = Query;

// select( /* multiple columns */ ) {
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
// count() {
//   this._select = $('COUNT(', this.schema.id, ') AS count');
//   this.dataParser = parseCount;
//   return this;
// };

// union(stringOrQuery) {
//   if (typeof stringOrQuery === 'string') {
//     this._union = stringOrQuer;
//     return this;
//   }
//
//   this._union = normaliseQuery(stringOrQuery);
//   return this;
// }
//
// function(func) {
//   this._select = func;
// }
