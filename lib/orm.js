'use strict';

var DML = require('./dml');
var Condition = require('./dml/condition');
var Logger = require('./logger');
var Connector = require('./ddl/connector');

class ORM {
  constructor(options) {
    if (!options.tag) throw Error('An unique tag is requisite!');

    this.options = options;
    this.schema = {};
    this.logger = new Logger(options);
    this.connector = new Connector(this.logger);
    this.dml = new DML(this.connector);
  }

  static $() {
    return Condition.$(arguments);
  }

  getSchema(name) {
    return this.schema[name];
  }

  connect() {
    return this.connector.connect(this.options)
      .then((schemas) => {
        this.schema = schemas;
      })
      .catch((err) => {
        this.logger.error(err.stack);
        process.exit(1);
      });
  }

  disconnect() {
    this.connector.disconnect();
  }

  outline(schemaName, record) {
    var schema = this.schema[schemaName];
    if (!schema) throw new Error('No schema named ' + schemaName);
    return schema.outline(record, (name) => this.schema[name]);
  }
}

module.exports = ORM;
