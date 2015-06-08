'use strict'

var fs = require('fs');
var path = require('path');
var util = require('util');
var _ = require('lodash');
var async = require('async');
var ddl = require('./ddl_engine');

exports = module.exports = function(engine) {
	this.ddlEngine = new ddl(engine);
}

function _findSyncStep(cb) {
	this.ddlEngine.performSQL('FIXME query last check point', function(err, result) {
		cb(err, result, '');
	});
}

exports.loadSteps = function(box, cb) {
	this.schemas = {};
	var steps = fs.readdirSync(box);
	if (steps.length == 0) {
		cb();
		return;
	}

	console.log(module.filename);
	console.log(box);
	var boxModulePath = path.relative(path.dirname(module.filename), box);

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
				});
			}.bind(this));
		}.bind(this);
	}.bind(this));

	var allSteps = _.flattenDeep([_findSyncStep.bind(this), stepChain]);
	async.waterfall(allSteps, function(err, __) {
		cb(err);
	});
}