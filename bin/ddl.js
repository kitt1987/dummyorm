#!/usr/bin/env node

'use strict';

var fs = require('fs');
var path = require('path');
var util = require('util');
var _ = require('lodash');
var async = require('async');
var colors = require('colors');
var multi = require('multiline');

function StepScript() {
	this.strict = '\'use strict\';';
	this.required = [];
	this.methods = [];
}

StepScript.prototype.addRequired = function(varname, path) {
	this.required.push(util.format('var %s = require(\'%s\');', varname, path));
};

function formatLine(t) {
	var v = t.replace(/{/g, '{\n');
	if (!_.endsWith(v, '}'))
		v += ';';
	return v.replace(/}/g, '\n};\n');
}

StepScript.prototype.addMember = function(name, func) {
	var v = util.format('exports.%s = %s', name, func);
	this.methods.push(formatLine(v));
};

StepScript.prototype.setExported = function(value) {
	if (!value) {
		this.exported = 'exports = module.exports = {};';
	} else {
		this.exported = 'exports = module.exports = ' + formatLine(value);
	}
};

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
};

function calcStep(database) {
	var steps = fs.readdirSync(database);
	var last_step = '';
	if (steps.length > 0) {
		last_step = steps[steps.length - 1];
	}

	var ss = new StepScript();
	ss.addRequired('orm', 'ormcache.js');
	ss.setExported();
	ss.addMember('lastStep', '\'' + last_step + '\'');
	ss.addMember('run', multi.stripIndent(function() {
		/*
				function(ormcache, done) {
					// FIXME create or modify schema here and call done() to save changes.
					// You could access each schema by calling ormcache[schemaTalbeName].
				}
			*/
	}));
	return ss.text();
}

function defineOptions() {
	var ArgumentParser = require('argparse').ArgumentParser;
	var parser = new ArgumentParser({
		version: '0.1.0',
		addHelp: true,
		description: 'Unit testing framework'
	});

	parser.addArgument(
		['-d', '--dir'], {
			action: 'append',
			help: 'directory steps placed. eg. -d dir1 -d dir2'
		}
	);

	parser.addArgument(
		['-m', '--merge'], {
			action: 'storeTrue',
			help: 'merge all steps into the 1st directory. eg. -m -d dir1 -d dir2'
		}
	);

	parser.addArgument(
		['-val', '--validate'], {
			action: 'storeTrue',
			help: 'validate all steps. eg. -v -d dir1 -d dir2'
		}
	);

	parser.addArgument(
		['-c', '--compact'], {
			action: 'storeTrue',
			help: 'compact all steps into 1 step placed in the 1st directory. eg. -c -d dir1 -d dir2'
		}
	);

	parser.addArgument(
		['-n', '--name'], {
			help: 'partial name of step to be created. eg. -n name'
		}
	);

	return parser.parseArgs();
}

// ocddl -d dir1 to create a new step
// ocddl -v -d dir1 -d dir2 to validate all steps in dir1 and dir2
// ocddl -c -d dir1 -d dir2 to compact steps in dir1 and dir2 into 1 step saved in dir1

function workInTmp(done) {
	var tmp = '.' + require('crypto').randomBytes(16).toString('hex');
	fs.mkdir(tmp, function(err) {
		if (err) {
			console.log(colors.red('Fail to make temp directory due to ') + err);
			throw err;
		}

		done(tmp);
	});
}

function updateLastSteps(tmp, dir) {
	var steps = _.map(fs.readdirSync(tmp), function(step) {
		return function(lastStep, cb) {
			var stepPath = path.join(tmp, step);
			var modulePath = path.relative(path.dirname(module.filename), stepPath);
			var stepModule = require(modulePath);
			if (lastStep !== stepModule.lastStep) {
				fs.writeFile(stepPath, util.format('\nexports.lastStep = \'%s\';', lastStep), {
						flag: 'a'
					},
					function(err) {
						if (err) {
							throw err;
						}

						fs.rename(stepPath, path.join(dir, path.basename(stepPath)), function(err) {
							if (err) {
								throw err;
							}

							cb(null, step);
						});
					});
				return;
			}

			fs.rename(stepPath, path.join(dir, path.basename(stepPath)), function(err) {
				if (err) {
					throw err;
				}

				cb(null, step);
			});
		};
	});
	steps[0] = steps[0].bind(null, '');
	async.waterfall(steps, function(err, result) {
		if (err) {
			console.log(colors.red('Fail to merge steps due to ' + err));
			throw err;
		}

		fs.rmdirSync(tmp);
	});
}

function mergeSteps(dir, steps, tmp) {
	async.eachSeries(steps, function(step, cb) {
		fs.rename(step, path.join(tmp, path.basename(step)), cb);
	}, function(err) {
		if (err) {
			console.log(colors.red('Fail to merge file due to ' + err));
			throw err;
		}

		updateLastSteps(tmp, dir);
	});
}

function validate(dirs) {
	var validators = [];
	_.forEach(dirs, function(dir) {
		var steps = fs.readdirSync(dir);
		if (steps.length === 0) {
			return;
		}

		var vs = _.map(steps, function(step) {
			return function(lastStep, cb) {
				var stepPath = path.join(dir, step);
				var modulePath = path.relative(path.dirname(module.filename), stepPath);
				var stepModule = require(modulePath);
				if (lastStep !== stepModule.lastStep) {
					cb('lastStep of ' + stepPath + ' should be ' + lastStep);
					return;
				}
				cb(null, step);
			}
		});

		vs[0] = vs[0].bind(null, '');
		vs[vs.length - 1] = function(lastStep, cb) {
			var stepPath = path.join(dir, steps[steps.length - 1]);
			var modulePath = path.relative(path.dirname(module.filename), stepPath);
			var stepModule = require(modulePath);
			if (lastStep !== stepModule.lastStep) {
				cb('lastStep of ' + stepPath + ' should be ' + lastStep);
				return;
			}
			cb();
		};

		validators.push(vs);
	});

	validators = _.flattenDeep(validators);
	async.waterfall(validators, function(err, result) {
		if (err) {
			console.error(colors.red('Error: ' + err));
		}
	});
}

function createStep(database, note) {
	if (!database)
		throw Error('You should set a folder to save all steps at least');

	if (!fs.existsSync(database))
		fs.mkdirSync(database);

	var footprint;
	if (note) {
		footprint = '' + Date.now() + '-' + note + '.js';
	} else {
		footprint = '' + Date.now() + '.js';
	}

	var step = path.join(database, footprint);
	if (fs.existsSync(step))
		throw Error('You or some others save the same steps or you put this command in a loop');

	fs.writeFile(step, calcStep(database), function(err) {
		if (err)
			throw err;
	});

	console.info(colors.green(footprint + ' is created'));
}

(function() {
	try {
		console.log(colors.yellow('Make sure run this under you project directory!!'));
		var args = defineOptions();
		if (!args.dir || args.dir.length === 0) {
			console.error(colors.red('You should indicate 1 directory at least!'));
			return;
		}

		if (_.uniq(args.dir).length !== args.dir.length) {
			console.error(colors.red('You\'ve just input same directories. Check the -d'));
			return;
		}

		if (args.merge) {
			var steps = _.map(args.dir, function(dir) {
				return _.map(fs.readdirSync(dir), function(step) {
					return path.join(dir, step);
				});
			});

			steps = _.flattenDeep(steps).sort();
			if (steps.length === 0) {
				console.log(colors.yellow('Nothing loaded'));
				return;
			}

			workInTmp(mergeSteps.bind(null, args.dir[0], steps));
			return;
		}

		if (args.compact) {
			console.error(colors.red('Waiting for releasing!'));
			return;
		}

		if (args.validate) {
			validate(args.dir);
			return;
		}

		if (fs.existsSync(args.dir[0])) {
			validate(args.dir);
		}

		createStep(args.dir[0], args.name);
	} catch (err) {
		console.error(colors.red(err.stack));
	}
})();