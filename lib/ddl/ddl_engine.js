'use strict';

var util = require('util');
var colors = require('colors');
var utilLocal = require('../utility');
var _ = require('lodash');
var PrivateFuncHelper = require('../private_helper');

class DDLEngine extends PrivateFuncHelper {
  constructor(engine, tag, logger) {
    super();
    this.engine = engine;
    this.tag = tag;
    this.logger = logger;
  }

  static get stepColumn() {
    return 'step_ts';
  }

  ddlTableName() {
    return '_ormcache_ddl_' + this.tag;
  }

  switchDB(db) {
    return this._(checkDB, db)
      .then(() => {
        this.logger.info(colors.green('Switch to database[' + db + ']'));
        return this.engine.useDB(db);
      })
      .then(() => this._(checkDDLTable))
      .then(() => this._(findSyncStep));
  }

  syncSchema(step, schema) {
    var pending = schema.getPending();
    const builder = {
      createTable,
      addColumns,
      modifyColumns,
      dropColumns,
      addIndicies,
      dropIndices,
      addForeignKey,
      dropForeignKey,
      addFullTextColumns
    };

    var seq = pending.map((p) => {
      return this._bind(builder[p.type], p.data, schema);
    });

    seq.push(this._bind(updateSyncStep, step));
    return utilLocal.chainPromise(seq);
  }
}

function describeColumn(columnObj) {
  if (!columnObj.sqlName)
    throw new Error('The column sqlName is requisite ' +
      util.inspect(columnObj));
  if (!columnObj.type && !columnObj.referTo)
    throw new Error('The column type is requisite ' + util.inspect(columnObj));
  if (columnObj.type.js === 'VARCHAR' && !columnObj.len)
    throw new Error('You should set length for String column');

  var columnDef = '';
  if (columnObj.len) {
    columnDef = util.format('%s %s(%d)', columnObj.sqlName, columnObj.type.sql,
      columnObj.len);
  } else {
    columnDef = util.format('%s %s', columnObj.sqlName, columnObj.type.sql);
  }

  if (columnObj.type.js == 'number' && columnObj.unsigned)
    columnDef += ' UNSIGNED';

  if (columnObj.unique) columnDef += ' UNIQUE ';

  if (columnObj.primary) {
    columnDef += ' PRIMARY KEY';
    columnObj.autoInc = true;
    columnObj.notNull = true;
  }

  if (columnObj.notNull) columnDef += ' NOT NULL';
  if (columnObj.autoInc) columnDef += ' AUTO_INCREMENT';
  return columnDef;
}

function createTable(createObj, schema) {
  if (!createObj.table) throw new Error('Table name is requisite');
  if (createObj.columns.length === 0)
    throw new Error('You should define 1 column at least');

  var columns = createObj.columns.map(describeColumn).join(',');
  var engine = 'InnoDB';
  var charset = '';
  if (createObj.options) {
    if (createObj.options.engine) engine = createObj.options.engine;
    if (createObj.options.charset)
      charset = 'CHARACTER SET ' + createObj.options.charset;
  }

  var sql = util.format('CREATE TABLE IF NOT EXISTS %s(%s) ENGINE=%s %s;',
    createObj.table, columns, engine, charset);
  return this.engine.performSQL(sql);
}

function addColumns(addColumnObj, schema) {
  if (addColumnObj.length === 0)
    throw new Error('You should define 1 column at least');

  var columns = addColumnObj.map((column) => {
    var columnDef = describeColumn(column);
    return util.format('ADD COLUMN %s', columnDef);
  }).join(',');

  var sql = util.format('ALTER TABLE %s %s;', schema.tableName, columns);
  return this.engine.performSQL(sql);
}

function addFullTextColumns(fullTextColumns, schema) {
  if (fullTextColumns.length === 0)
    throw new Error('You should define 1 column at least');

  var columns = fullTextColumns.join(',');

  var sql = util.format('ALTER TABLE %s ADD FULLTEXT (%s);', schema.tableName,
    columns);
  return this.engine.performSQL(sql);
}

function modifyColumns(modifyObj, schema) {
  if (modifyObj.length === 0)
    throw new Error('You should define 1 column at least');

  var columns = modifyObj.map((column) => {
    var columnDef = describeColumn(column);
    return util.format('MODIFY COLUMN %s', columnDef);
  }).join(',');

  var sql = util.format('ALTER TABLE %s %s;', schema.tableName, columns);
  return this.engine.performSQL(sql);
}

function dropColumns(dropColumnObj, schema) {
  if (dropColumnObj.length === 0)
    throw new Error('You should define 1 column at least');

  var columns = dropColumnObj.map((column) => {
    return util.format('DROP COLUMN %s', column.sqlName);
  }).join(',');

  var sql = util.format('ALTER TABLE %s %s;', schema.tableName, columns);
  return this.engine.performSQL(sql);
}

function _describeIndex(indexObj) {
  if (!indexObj.name)
    throw new Error('Index name is requisite');
  if (indexObj.column.length === 0)
    throw new Error(util.format(
      'You should define 1 column for index %s at least', indexObj.name));
  var columnDef = '';
  if (indexObj.type) {
    columnDef = util.format('ADD INDEX %s %s (%s)', indexObj.name,
      indexObj.type.sql, _.map(indexObj.column, 'sqlName').join(','));
  } else {
    columnDef = util.format('ADD INDEX %s (%s)', indexObj.name,
      _.map(indexObj.column, 'sqlName').join(','));
  }

  return columnDef;
}

function addIndicies(addIndexObj, schema) {
  if (addIndexObj.length === 0)
    throw new Error('You should define 1 index at least');
  var indecies = addIndexObj.map(_describeIndex).join(',');
  var sql = util.format('ALTER TABLE %s %s;', schema.tableName, indecies);
  return this.engine.performSQL(sql);
}

function dropIndices(dropIndexObj, schema) {
  if (dropIndexObj.length === 0)
    throw new Error('You should drop 1 index at least');
  var indecies = dropIndexObj.map((index) => {
    return util.format('DROP INDEX %s;', index);
  }).join(',');

  var sql = util.format('ALTER TABLE %s %s;', schema.tableName, indecies);
  return this.engine.performSQL(sql);
}

function _describeAddForeignKey(tableName, fkObj) {
  var fkDef = util.format('CONSTRAINT %s FOREIGN KEY (%s) REFERENCES %s(%s)',
    fkObj.fkName, fkObj.sqlName, fkObj.schemaReferred,
    fkObj.refers.name);
  return 'ADD ' + fkDef;
}

function addForeignKey(fkObjs, schema) {
  if (fkObjs.length === 0)
    throw new Error('You should define 1 foreign key at least');

  var fks = fkObjs.map(
    _describeAddForeignKey.bind(null, schema.tableName)
  ).join(',');
  var sql = util.format('ALTER TABLE %s %s;', schema.tableName, fks);
  return this.engine.performSQL(sql);
}

function _describeDropForeignKey(tableName, fkObj) {
  return util.format('DROP FOREIGN KEY %s, DROP COLUMN %s',
    fkObj.fkName, fkObj.sqlName);
}

function dropForeignKey(fkObjs, schema) {
  if (fkObjs.length === 0)
    throw new Error('You should define 1 foreign key at least');

  var fks = fkObjs.map(
    _describeDropForeignKey.bind(null, schema.tableName)
  ).join(',');
  var sql = util.format('ALTER TABLE %s %s', schema.tableName, fks);
  return this.engine.performSQL(sql);
}

function updateSyncStep(step) {
  var up = 'UPDATE ' + this.ddlTableName() + ' SET ' + DDLEngine.stepColumn +
    '=' + step + ';';
  return this.engine.performSQL(up);
}

function checkDB(db) {
  var dbCreation = 'CREATE DATABASE IF NOT EXISTS ' + db +
    ' CHARACTER SET utf8;';
  return this.engine.performSQL(dbCreation);
}

function checkDDLTable() {
  var ddlCreation = 'CREATE TABLE IF NOT EXISTS ' +
    this.ddlTableName() + '(id INT PRIMARY KEY AUTO_INCREMENT, ' +
    DDLEngine.stepColumn + ' BIGINT NOT NULL) ENGINE=InnoDB;';
  return this.engine.performSQL(ddlCreation);
}

function findSyncStep() {
  var queryStep = 'SELECT ' + DDLEngine.stepColumn + ' FROM ' +
    this.ddlTableName() + ';';
  return this.engine.performSQL(queryStep)
    .then((result) => {
      if (result.length > 1) {
        this.logger.error(colors.red('Malformed database'));
        throw new Error('Malformed database');
      }

      if (result.length == 1) {
        var latestSyncTs = result[0][this.ddlTableName()][DDLEngine.stepColumn];
        this.logger.info(colors.green('The last step is ' + latestSyncTs));
        return latestSyncTs;
      }

      return this.engine.performSQL('INSERT INTO ' + this.ddlTableName() +
        '(' + DDLEngine.stepColumn + ') VALUES(0);');
    });
}

module.exports = DDLEngine;
