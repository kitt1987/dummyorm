'use strict';

var fs = require('fs');
var path = require('path');
var util = require('util');
var async = require('async');
var ddl = require('./ddl_engine');
var logger = require('../logger');
var utilLocal = require('../utility');

exports = module.exports = function(engine, tag) {
  this.ddlEngine = new ddl(engine, tag);
};

exports.drop = function(schema, cb) {
  var dropSchema = 'DROP TABLE ' + schema.tableName;
  this.ddlEngine.performSQL(dropSchema, cb);
};

exports.dropDB = function(db, cb) {
  var dropDatabase = 'DROP DATABASE ' + db;
  this.ddlEngine.performSQL(dropDatabase, cb);
};

exports.currentStep = function(cb) {
  this.ddlEngine.currentStep(cb);
};

function _switchDB(db) {
  return this.ddlEngine.switchDB(db);
}

function figureOutPendingSchemas() {
  return this.schemas.reduce((pending, schema) => {
    // FIXME incorrect order
    if (Object.keys(schema.pending).length > 0)
      pending.push(schema);
    return pending;
  }, [], this);
}

function _stepRunnerCb(stepTs, syncTs, stepName) {
  var schemas = figureOutPendingSchemas.apply(this);
  if (schemas.length === 0) {
    logger.warn('No schemas to be saved');
    acb(null, syncTs, stepName);
    return;
  }

  var self = this;
  if (stepTs <= syncTs) {
    logger.warn(util.format(
      'The schemas DO NOT sync to Storage due to its stepTs(%d) <= syncTs(%d)',
      stepTs, syncTs));
    schemas.forIn((schema) => {
      if (self[schema.tableName] &&
        typeof self[schema.tableName] !== typeof schema) {
        logger.error(util.format(
          'Schema %s has been defined.', schema.tableName));
        acb(new Error(util.format(
          'Schema %s has been saved. Your should choose another name',
          schema.tableName)));
        return;
      }

      schema.getPending();
      self[schema.tableName] = schema;
    });

    acb(null, syncTs, stepName);
    return;
  }

  async.series(schemas.map((schema) => {
    return function(cb) {
      self.ddlEngine.syncSchema(stepTs, schema, function(err) {
        if (err) {
          logger.error(util.format(
            'Fail to sync schemas %s due to ', schema.tableName) + err);
          cb(err);
          return;
        }

        logger.info(util.format(
          'Sync step %s/%s to Storage', stepName, schema.tableName));
        if (self[schema.tableName] &&
          typeof self[schema.tableName] !== typeof schema) {
          logger.error(util.format(
            'Schema %s has been defined.', schema.tableName, err));
          cb(new Error(util.format(
            'Schema %s has been saved. Your should choose another name',
            schema.tableName)));
          return;
        }

        self[schema.tableName] = schema;
        cb(err);
      });
    };
  }), function(err) {
    if (err) {
      acb(err);
      return;
    }
    acb(null, syncTs, stepName);
  });

}

function _loadStep(prefixModulePath, stepName, syncTs, lastStep) {
  logger.info('Run step ' + stepName);
  var stepTs = parseInt(stepName.slice(0, 13));
  var stepPath = path.join(prefixModulePath, stepName);
  var step = require(stepPath);

  if (!lastStep || !step.lastStep)
    logger.warn('No last step defined in ' + stepName);

  if (lastStep) {
    if (step.lastStep) {
      if (lastStep != step.lastStep) {
        logger.error(util.format('Step not matched %s vs %s',
          lastStep, step.lastStep));
        throw new Error(util.format('Step not matched %s vs %s',
          lastStep, step.lastStep));
      }
    } else {
      var lastStepTs = parseInt(lastStep.slice(0, 13));
      if (stepTs <= lastStepTs) {
        logger.error(util.format('Step not matched %s vs %s',
          lastStepTs, stepTs));
        throw new Error(util.format('Step not matched %s vs %s',
          lastStepTs, stepTs));
      }
    }
  }

  step.run.call(this);
  _stepRunnerCb.call(this, stepTs, syncTs, stepName)
}

exports.loadSteps = function(stepPath, database) {
  var stepChain;
  if (typeof stepPath !== 'string') {
    logger.error(
      'You must merge all your steps into 1 directory and them load them'
    );
    throw new Error('Merge steps first');
  }

  logger.info('' + stepChain.length + ' steps will be applied to stepPath[' +
    database + ']');

  var steps = fs.readdirSync(stepPath).filter(
    (s) => s[0] !== '.' && s.endsWith('.js')
  );

  if (steps.length === 0) {
    logger.warn('No steps loaded');
    return;
  }

  var modulePath = path.relative(path.dirname(module.filename), stepPath);
  steps.map((step) => _loadStep.bind(this, modulePath, step));

  return utilLocal.seqPromise(steps.map((step) => {
    return _loadStep(modulePath, step)
  }), _switchDB(database));
};
