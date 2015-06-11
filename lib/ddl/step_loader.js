'use strict'

var fs = require('fs');
var path = require('path');
var util = require('util');
var _ = require('lodash');
var async = require('async');
var ddl = require('./ddl_engine');

exports = module.exports = function(engine) {
	this.ddlEngine = new ddl(engine);
	this.ddlTable = '_ormcache_ddl';
	this.stepColumn = 'step_ts';
}

function _findSyncStep(db, cb) {
	var dbCreation = 'CREATE DATABASE IF NOT EXISTS ' + db + ';';
	var ddlCreation = 'CREATE TABLE IF NOT EXISTS ' +
		this.ddlTable + '(id INT PRIMARY KEY, ' + this.stepColumn +
		' INT NOT NULL);'
	var use = 'USE ' + db + ';';
	var queryStep = 'SELECT ' + this.stepColumn + ' FROM ' + this.ddlTable + ';';
	this.ddlEngine.performSQL(dbCreation + use + ddlCreation + queryStep, function(err, result) {
		console.log('db err:' + err);
		console.log('db result:' + util.inspect(result));
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
					acb(null, syncTs, step.lastStep);
					return;
				}

				if (stepTs <= syncTs) {
					// FIXME Query schema to determine its id
					this.schemas[schema.tableName] = schema;
					acb(null, syncTs, step.lastStep);
					return;
				}

				this.ddlEngine.syncSchema(schema, function(err, schema) {
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
			[_findSyncStep.bind(this, dbName), stepChain]),
		function(err, __) {
			cb(err);
		});
}