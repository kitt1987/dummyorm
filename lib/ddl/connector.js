'use strict';

var Mysql = require('../driver/mysql');
var DDLEngine = require('./ddl_engine');
var DDL = require('./index');
var utilLocal = require('../utility');
const fs = require('fs');
const path = require('path');
const util = require('util');

class Connector {
  constructor(logger) {
    this.logger = logger;
  }

  connect(options) {
    if (this.storage) throw new Error('Storage has been defined');
    this.storage = new Mysql(options.connection);
    return this.storage.connect()
      .then(() => {
        var ddl = new DDL();
        var ddlEngine = new DDLEngine(this.storage, options.tag, this.logger);
        return ddlEngine.switchDB(options.db)
          .then(
            (syncTs) => this.loadSteps(options.stepPath, options.db, ddl,
              ddlEngine, syncTs)
          ).then(() => ddl.schemas);
      });
  }

  disconnect() {
    if (this.storage)
      this.storage.disconnect();
  }

  getStorage() {
    return this.storage;
  }

  loadSteps(stepPath, database, ddl, ddlEngine, syncTs) {
    if (typeof stepPath !== 'string') {
      this.logger.error(
        'You must set a directory which save all your schema definition.'
      );
      throw new Error('Merge steps first');
    }

    var steps = fs.readdirSync(stepPath).filter(
      (s) => s[0] !== '.' && s.endsWith('.js')
    );

    if (steps.length === 0) {
      this.logger.warn('No steps loaded');
      return;
    }

    this.logger.info('' + steps.length +
      ' steps will be applied to stepPath[' + database + ']');

    var modulePath = path.relative(path.dirname(module.filename), stepPath);
    var stepModules = steps.map((step, i) => {
      const lastStep = steps[i - 1];
      var stepModule = require(path.join(modulePath, step));
      if (lastStep && lastStep !== stepModule.lastStep)
        throw new Error('lastStep of ' + step + ' should be ' + lastStep);

      stepModule.stepTs = parseInt(step.slice(0, 13));
      stepModule.name = step;
      return stepModule;
    });

    var stepLoader = stepModules.map((step) => {
      return new Promise((resolve, reject) => {
        step.run(ddl);
        var schemas = ddl.getPendingSchema();
        if (schemas.length === 0) {
          this.logger.warn('No schemas defined in ' + step.name);
          resolve();
          return;
        }

        if (step.stepTs <= syncTs) {
          this.logger.warn(util.format(
            'Skip sync cuz its stepTs(%d) <= syncTs(%d)', step.stepTs, syncTs));
          schemas.forEach((schema) => {
            // NOTE clear pending state
            schema.getPending();
          });

          resolve();
          return;
        }

        var syncSchema = schemas.map((schema) => {
          return ddlEngine.syncSchema(step.stepTs, schema)
            .then(() => {
              this.logger.info(util.format('Sync step %s/%s to Storage',
                step.name, schema.tableName));
            });
        });

        resolve(utilLocal.seqPromise(syncSchema));
      });
    });

    return utilLocal.seqPromise(stepLoader);
  }
}

module.exports = Connector;
