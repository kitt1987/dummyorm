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
		cb(err);
	});
}

function _switchDB(db, cb) {
	var use = 'USE ' + db + ';';
	this.ddlEngine.performSQL(use, function(err, result) {
		cb(err);
	});
}

function _checkDDLTable(cb) {
	var ddlCreation = 'CREATE TABLE IF NOT EXISTS ' +
		this.ddlTable + '(id INT PRIMARY KEY, ' + this.stepColumn +
		' INT NOT NULL);'
	this.ddlEngine.performSQL(ddlCreation, function(err, result) {
		cb(err);
	});
}

function _findSyncStep(cb) {
	var queryStep = 'SELECT ' + this.stepColumn + ' FROM ' + this.ddlTable + ';';
	this.ddlEngine.performSQL(queryStep, function(err, result) {
		cb(err, result, '');
	});
}

exports.loadSteps = function(database, cb) {
	this.schemas = {};
	var steps = fs.readdirSync(database);
	if (steps.length == 0) {
		cb();
		return;
	}

	var boxModulePath = path.relative(path.dirname(module.filename), database);
	var dbName = path.basename(database);

	var stepChain = _.map(steps, function(s) {
		return function(syncTs, lastStep, acb) {
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
					console.log(colors.red('No schema to be saved'));
					logger.warn('No schema to be saved');
					acb(null, syncTs, step.lastStep);
					return;
				}

				if (stepTs <= syncTs) {
					logger.warn(util.format('The schema will not sync to Storage \
						due to its stepTs(%d) <= syncTs(%d)', stepTs, syncTs));
					this.schemas[schema.tableName] = schema;
					acb(null, syncTs, step.lastStep);
					return;
				}

				this.ddlEngine.syncSchema(schema, function(err) {
					if (err) {
						acb(err);
						return;
					}

					this.schemas[schema.tableName] = schema;
					acb(null, syncTs, step.lastStep);
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