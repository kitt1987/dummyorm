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
	this.ddlTable = '_ormcache_ddl';
	this.stepColumn = 'step_ts';
}

function _checkDB(db, cb) {
	var dbCreation = 'CREATE DATABASE IF NOT EXISTS ' + db + ';';
	this.ddlEngine.performSQL(dbCreation, function(err, result) {
		if (err) {
			logger.error(colors.red('Fail to create database[' +
				db + '] due to ' + err));
		} else {
			logger.info(colors.green('database[' + db + '] is created'));
		}
		cb(err);
	});
}

function _switchDB(db, cb) {
	this.ddlEngine.switchDB(db, function(err) {
		if (err) {
			logger.error(colors.red('Fail to switch to database[' +
				db + '] due to ' + err));
		} else {
			logger.info(colors.green('Switch to database[' + db + ']'));
		}
		cb(err);
	});
}

function _checkDDLTable(cb) {
	var ddlCreation = 'CREATE TABLE IF NOT EXISTS ' +
		this.ddlTable + '(id INT PRIMARY KEY, ' + this.stepColumn +
		' INT NOT NULL);'
	this.ddlEngine.performSQL(ddlCreation, function(err, result) {
		if (err) {
			logger.error(colors.red('Fail to create DDL table due to ' + err));
		} else {
			logger.info(colors.green('DDL table is created'));
		}

		cb(err);
	});
}

function _updateSyncStep(step, cb) {
	var up = 'UPDATE ' + this.ddlTable + ' SET ' + this.stepColumn +
		'=\'' + step + '\'';
	this.ddlEngine.performSQL(up, function(err, result) {
		if (err) {
			logger.error(colors.red('Fail to update DDL table due to ' + err));
		}

		cb(err);
	});
}

function _findSyncStep(cb) {
	var queryStep = 'SELECT ' + this.stepColumn + ' FROM ' + this.ddlTable + ';';
	this.ddlEngine.performSQL(queryStep, function(err, result) {
		if (err) {
			logger.error(colors.red('Fail to load the last step due to ' + err));
		} else {
			logger.info(colors.green('The last step is ' + result));
		}

		cb(err, result, '');
	});
}

exports.drop = function(schema, cb) {
	var dropSchema = 'DROP TABLE ' + schema.tableName;
	this.ddlEngine.performSQL(dropSchema, cb);
}

exports.dropDB = function(db, cb) {
	var dropDatabase = 'DROP DATABASE ' + db;
	this.ddlEngine.performSQL(dropDatabase, cb);
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

			if (lastStep && lastStep != step.lastStep) {
				acb(new Error(util.format('Step not matched %s vs %s',
					lastStep, step.lastStep)));
				return;
			}

			step.run(this, function(schema) {
				if (!schema) {
					logger.warn(colors.yellow('No schema to be saved'));
					acb(null, syncTs, step.lastStep);
					return;
				}

				if (stepTs <= syncTs) {
					logger.warn(colors.yellow(util.format('The schema will not sync \
						to Storage due to its stepTs(%d) <= syncTs(%d)', stepTs, syncTs)));
					this.schemas[schema.tableName] = schema;
					acb(null, syncTs, step.lastStep);
					return;
				}

				this.ddlEngine.syncSchema(schema, function(err) {
					if (err) {
						logger.error(colors.red('Fail to sync schema due to ' + err));
						acb(err);
						return;
					}

					logger.info(colors.green('Sync step ' + s + ' to Storage'));
					this.schemas[schema.tableName] = schema;
					_updateSyncStep.bind(this, stepTs)(function(err) {
						if (err) {
							acb(err);
							return;
						}

						acb(null, syncTs, step.lastStep);
					}.bind(this));
				}.bind(this));
			}.bind(this));
		}.bind(this);
	}.bind(this));

	async.waterfall(_.flattenDeep(
			[
				_checkDB.bind(this, dbName),
				_switchDB.bind(this, dbName),
				_checkDDLTable.bind(this),
				_findSyncStep.bind(this),
				stepChain
			]),
		function(err, __) {
			cb(err);
		});
}