'use strict';

var Logger = require('./logger');
var Connector = require('./ddl/connector');
const _ = require('lodash');

class ORM {
  constructor(options) {
    if (!options.tag) throw Error('An unique tag is requisite!');

    this.options = options;
    this.logger = new Logger(options);
    this.connector = new Connector(this.logger);
    this.schema = {};
  }

  connect() {
    return this.connector.connect(this.options)
      .then((schemas) => {
        Object.assign(this.schema, _.forIn(schemas, (v) => {
          v.setSchemaFinder((name) => this.schema[name]);
        }));
      })
      .catch((err) => {
        this.logger.error(err.stack);
        process.exit(1);
      });
  }

  disconnect() {
    this.connector.disconnect();
  }
}

module.exports = ORM;
