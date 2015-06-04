'use strict'

var fs = require('fs');
var path = require('path');
var util = require('util');
var _ = require('lodash');
var ddlEngine = require('./engine').ddlEngine;

exports = module.exports = {};

function findSyncStep() {
	ddlEngine.performSQL('FIXME query last check point');
}

exports.go = function(box, cb) {
	this.schemas = {};
	var syncStep = findSyncStep();
	var steps = fs.readdirSync(box);

	var stepChain = _.map(steps, function(s) {
		return function(lastStep, acb) {
			var stepTs = _(s.slice(0, 13)).value();
			var stepPath = path.join(box, s);
			var step = require(stepPath);
			if (lastStep != step.lastStep) {
				throw Error(util.format('Step not matched %s vs %s',
					lastStep, step.lastStep));
			}

			step.run(this.schemas, function(schema) {
				if (stepTs <= syncStep) {
					this.schemas[schema.tableName] = schema;
					acb(null, step.lastStep);
					return;
				}

				ddlEngine.syncSchema(schema, function(err, schema) {
					if (err) {
						acb(err, null);
						return;
					}

					this.schemas[schema.tableName] = schema;
					acb(null, step.lastStep);
				});
			}.bind(exports));
		}.bind(exports);
	});

	async.waterfall(stepChain, function(err, __) {
		if (err)
			throw err;
	});
}