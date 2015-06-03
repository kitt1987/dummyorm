'use strict'

var fs = require('fs');
var path = require('path');
var _ = require('lodash');

exports = module.exports = {};

function findLastStep() {

}

exports.go = function(box) {
	this.schemas = {};
	var lastStep = findLastStep();
	var steps = fs.readdirSync(box);
	_.forIn(steps, function(step) {
		var stepPath = path.join(box, step);
		require(stepPath).run(this.schemas, function(schema) {

		});
	});
}