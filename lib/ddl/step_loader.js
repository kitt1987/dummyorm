'use strict';

var fs = require('fs');
var path = require('path');
var util = require('util');
var _ = require('lodash');
var u = require('../utility');
var async = require('async');
var ddl = require('./ddl_engine');
var logger = require('../logger');
var Schema = require('../schema');

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

function _switchDB(db, acb) {
	this.ddlEngine.switchDB(db, function(err, step) {
		acb(err, step, '');
	});
}

function figureOutPendingSchemas() {
	return _.reduce(this.schemas, function(pending, schema) {
		// FIXME incorrect order
		if (_.keys(schema.pending).length > 0)
			pending.push(schema);
		return pending;
	}, [], this);
}

function _stepRunnerCb(stepTs, syncTs, stepName, acb) {
	var schemas = figureOutPendingSchemas.apply(this);
	if (schemas.length === 0) {
		logger.warn('No schemas to be saved');
		acb(null, syncTs, stepName);
		return;
	}

	var self = this;
	if (stepTs <= syncTs) {
		var warning = 'The schemas DO NOT sync to Storage due to its stepTs(%d) <= syncTs(%d)';
		logger.warn(util.format(warning, stepTs, syncTs));
		_.forIn(schemas, function(schema) {
			if (self[schema.tableName] && typeof self[schema.tableName] !== typeof schema) {
				logger.error(util.format(
					'Schema %s has been defined.', schema.tableName));
				acb(new Error(util.format('Schema %s has been saved. Your should choose another name',
					schema.tableName)));
				return;
			}

			schema.getPending();
			self[schema.tableName] = schema;
		});

		acb(null, syncTs, stepName);
		return;
	}

	async.series(_.map(schemas, function(schema) {
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
				if (self[schema.tableName] && typeof self[schema.tableName] !== typeof schema) {
					logger.error(util.format(
						'Schema %s has been defined.', schema.tableName, err));
					cb(new Error(util.format('Schema %s has been saved. Your should choose another name',
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

function _loadStep(prefixModulePath, stepName, syncTs, lastStep, acb) {
	logger.info('Run step ' + stepName);
	var stepTs = _(stepName.slice(0, 13)).value();
	var stepPath = path.join(prefixModulePath, stepName);
	var step = require(stepPath);

	if (!lastStep || !step.lastStep) {
		logger.warn('No last step defined in ' + stepName);
	}

	if (lastStep) {
		if (step.lastStep) {
			if (lastStep != step.lastStep) {
				logger.error(util.format('Step not matched %s vs %s',
					lastStep, step.lastStep));
				acb(new Error(util.format('Step not matched %s vs %s',
					lastStep, step.lastStep)));
				return;
			}
		} else {
			var lastStepTs = _(lastStep.slice(0, 13)).value();
			if (stepTs <= lastStepTs) {
				logger.error(util.format('Step not matched %s vs %s',
					lastStepTs, stepTs));
				acb(new Error(util.format('Step not matched %s vs %s',
					lastStepTs, stepTs)));
				return;
			}
		}
	}

	step.run(this, _stepRunnerCb.bind(this, stepTs, syncTs, stepName, acb));
}

function _loadStepChains(stepPath) {
	var steps = fs.readdirSync(stepPath);
	if (steps.length === 0) {
		logger.warn('No steps loaded');
		return;
	}

	var modulePath = path.relative(path.dirname(module.filename), stepPath);
	var self = this;
	return _.map(steps, function(step) {
		return _loadStep.bind(self, modulePath, step);
	});
}

exports.loadSteps = function(stepPath, database, cb) {
	var stepChain;
	if (typeof stepPath === 'string') {
		stepChain = _loadStepChains.bind(this)(stepPath);
	} else {
		logger.error('You must merge all your steps into 1 directory and them load them');
		cb(new Error('Merge steps first'));
	}

	logger.info('' + stepChain.length +
		' steps will be applied to stepPath[' + database + ']');

	async.waterfall(_.flattenDeep(
			[
				_switchDB.bind(this, database),
				stepChain
			]),
		function(err, __) {
			cb(err);
		});
};
