'use strict'

var fs = require('fs');
var path = require('path');
var util = require('util');
var _ = require('lodash');
var async = require('async');

function StepScript() {
	this.strict = '\'use strict\'';
	this.required = [];
	this.methods = [];
}

StepScript.prototype.addRequired = function(varname, path) {
	this.required.push(util.format('var %s = require(\'%s\');', varname, path));
}

function formatLine(t) {
	var v = t.replace(/{/g, '{\n');
	if (!_.endsWith(v, '}'))
		v += ';';
	return v.replace(/}/g, '\n}\n');
}

StepScript.prototype.addMember = function(name, func) {
	var v = util.format('exports.%s = %s', name, func);
	this.methods.push(formatLine(v));
}

StepScript.prototype.setExported = function(value) {
	if (!value) {
		this.exported = 'exports = module.exports = {}';
	} else {
		this.exported = 'exports = module.exports = ' + formatLine(value);
	}
}

StepScript.prototype.text = function() {
	var all = _.flattenDeep([this.strict, this.required, this.exported, this.methods]);
	var v;
	return all.reduce(function(line1, line2) {
		if (line1) {
			return line1 + '\n' + line2;
		} else {
			return line2;
		}
	});
}

function calcStep(box) {
	var steps = fs.readdirSync(box);
	var last_step = '';
	if (steps.length > 0) {
		last_step = steps[steps.length - 1];
	}

	var ss = new StepScript();
	ss.addRequired('ormcache', 'ormcache');
	ss.setExported();
	ss.addMember('lastStep', '\'' + last_step + '\'');
	ss.addMember('run', 'function(schemas, cb) { \
		// FIXME create or modify schema here and pass the cb to orm \
		\n\t\t// You could access each schema by calling schemas.schema_talbe_name. \
	}');
	return ss.text();
}

(function() {
	var box = process.argv[2];
	if (!box)
		throw Error('You should set a folder to save all steps at least');

	if (!fs.existsSync(box))
		fs.mkdirSync(box);

	var note = process.argv[3];
	if (note) {
		var footprint = '' + Date.now() + '-' + note + '.js';
	} else {
		var footprint = '' + Date.now() + '.js';
	}

	var step = path.join(box, footprint);
	if (fs.existsSync(step))
		throw Error('You or some others save the same steps or you put this command in a loop');

	fs.writeFile(step, calcStep(box), function(err) {
		if (err)
			throw err;
	});

	console.info('%s is created', footprint);
})();