'use strict'

var fs = require('fs');
var path = require('path');
var util = require('util');
var _ = require('lodash');
var async = require('async');
var ddl = require('./ddl_engine');
var logger = require('winston');
var colors = require('colors');

exports = module.exports = function(engine) {
	this.ddlEngine = new ddl(engine);
}

exports.drop = function(schemas, cb) {
	var dropSchema = 'DROP TABLE ' + schemas.tableName;
	this.ddlEngine.performSQL(dropSchema, cb);
}

exports.dropDB = function(db, cb) {
	var dropDatabase = 'DROP DATABASE ' + db;
	this.ddlEngine.performSQL(dropDatabase, cb);
}

exports.currentStep = function(cb) {
	this.ddlEngine.currentStep(cb);
}

function _switchDB(db, acb) {
	this.ddlEngine.switchDB(db, function(err, step) {
		acb(err, step, '');
	})
}

exports.loadSteps = function(database, cb) {
	this.schemas = {};
	var steps = fs.readdirSync(database);
	if (steps.length == 0) {
		logger.warn(colors.yellow('No steps loaded'));
		cb();
		return;
	}

	var boxModulePath = path.relative(path.dirname(module.filename), database);
	var dbName = path.basename(database);
	logger.info(colors.green('' + steps.length +
		' steps will be applied to database[' + dbName + ']'));

	var stepChain = _.map(steps, function(s) {
		return function(syncTs, lastStep, acb) {
			logger.info(colors.green('Run step ' + s));
			var stepTs = _(s.slice(0, 13)).value();
			var stepPath = path.join(boxModulePath, s);
			var step = require(stepPath);

			if (!lastStep) {
				logger.warn(colors.yellow('No last step defined in ' + s));
			}

			if (lastStep && lastStep != step.lastStep) {
				logger.error(colors.red(util.format('Step not matched %s vs %s',
					lastStep, step.lastStep)));
				acb(new Error(util.format('Step not matched %s vs %s',
					lastStep, step.lastStep)));
				return;
			}

			step.run(this, function(schemas) {
				schemas = _.isArray(schemas) ? schemas : [schemas];
				if (schemas.length == 0) {
					logger.warn(colors.yellow('No schemas to be saved'));
					acb(null, syncTs, s);
					return;
				}

				if (stepTs <= syncTs) {
					logger.warn(colors.yellow(util.format('The schemas DO NOT sync \
						to Storage due to its stepTs(%d) <= syncTs(%d)', stepTs, syncTs)));
					_.forIn(schemas, function(s) {
						this.schemas[s.tableName] = s;
					}.bind(this));

					acb(null, syncTs, s);
					return;
				}

				async.series(_.map(schemas, function(schema) {
					return function(cb) {
						this.ddlEngine.syncSchema(stepTs, schema, function(err) {
							if (err) {
								logger.error(colors.red(util.format(
									'Fail to sync schemas %s due to ', schema.tableName, err)));
								cb(err);
								return;
							}

							logger.info(colors.green(util.format(
								'Sync step %s/%s to Storage', s, schema.tableName)));
							this.schemas[schema.tableName] = schema;
							cb(err);
						}.bind(this));
					}.bind(this);
				}.bind(this)), function(err) {
					if (err) {
						acb(err);
						return;
					}
					acb(null, syncTs, s);
				});
			}.bind(this));
		}.bind(this);
	}.bind(this));

	async.waterfall(_.flattenDeep(
			[
				_switchDB.bind(this, dbName),
				stepChain
			]),
		function(err, __) {
			cb(err);
		});
}