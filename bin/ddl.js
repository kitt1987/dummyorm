#!/usr/bin/env node

'use strict';

var fs = require('fs');
var path = require('path');
var util = require('util');
var _ = require('lodash');
var colors = require('colors');

const stepRunner = function(ormcache) {
  // FIXME create or modify schema here.
  // You could access each schema by calling ormcache[schemaTalbeName].
};

function StepScript() {
  this.strict = '\'use strict\';';
  this.required = [];
  this.methods = [];
}

StepScript.prototype.addRequired = function(varname, path) {
  this.required.push(util.format('var %s = require(\'%s\');', varname, path));
};

StepScript.prototype.addMember = function(name, func) {
  if (typeof func === 'function') func = func.toString();
  var v = util.format('exports.%s = %s', name, func);
  this.methods.push(v);
};

StepScript.prototype.setExported = function() {
  this.exported = 'exports = module.exports = {};';
};

StepScript.prototype.text = function() {
  var all = _.flattenDeep([
    this.strict, this.required, this.exported, this.methods
  ]);
  return all.reduce((line1, line2) => {
    if (line1) {
      return line1 + '\n' + line2;
    } else {
      return line2;
    }
  });
};

function readSteps(database) {
  return fs.readdirSync(database).filter((s) => s[0] !== '.');
}

function calcStep(database) {
  var steps = readSteps(database);
  var last_step = '';
  if (steps.length > 0) last_step = steps[steps.length - 1];

  var ss = new StepScript();
  ss.addRequired('orm', 'ormcache.js');
  ss.setExported();
  ss.addMember('lastStep', '\'' + last_step + '\'');
  ss.addMember('run', stepRunner);
  return ss.text();
}

function error(t) {
  console.log(colors.red(t));
}

function warn(t) {
  console.log(colors.yellow(t));
}

function info(t) {
  console.log(colors.green(t));
}

function defineOptions() {
  var ArgumentParser = require('argparse').ArgumentParser;
  var parser = new ArgumentParser({
    version: require('../package.json').version,
    addHelp: true,
    description: 'Generate, merge or validate ddl steps of ormcache.'
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
      help: 'compact all steps into 1 step placed in the 1st directory. eg. -c \
      -d dir1 -d dir2'
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
// ocddl -c -d dir1 -d dir2 to compact steps in dir1 and dir2 into 1 step saved
// in dir1

function mergeSteps(dir, steps) {
  var tmp = '.' + require('crypto').randomBytes(16).toString('hex');
  fs.mkdirSync(tmp);

  steps.forEach((step) => {
    fs.renameSync(step, path.join(tmp, path.basename(step)));
  });

  readSteps(tmp).reduce((lastStep, step) => {
    var stepPath = path.join(tmp, step);
    var modulePath = path.relative(path.dirname(module.filename), stepPath);
    var stepModule = require(modulePath);
    if (lastStep !== stepModule.lastStep) {
      fs.writeFileSync(stepPath,
        util.format('\nexports.lastStep = \'%s\';', lastStep), {
          flag: 'a'
        });
      fs.renameSync(stepPath,
        path.join(dir, path.basename(stepPath)));
    } else {
      fs.rename(stepPath, path.join(dir, path.basename(stepPath)));
    }

    return step;
  }, '');

  fs.rmdirSync(tmp);
}

function validate(dirs) {
  dirs.forEach((dir) => {
    var steps = readSteps(dir);
    if (steps.length === 0) return;

    steps.reduce((lastStep, step) => {
      var stepPath = path.join(dir, step);
      var modulePath = path.relative(path.dirname(module.filename), stepPath);
      var stepModule = require(modulePath);
      if (lastStep !== stepModule.lastStep)
        throw new Error('lastStep of ' + stepPath + ' should be ' + lastStep);

      return step;
    }, '');
  });
}

function createStep(database, note) {
  if (!database)
    throw Error('You should set a folder to save all steps at least');

  if (!fs.existsSync(database)) fs.mkdirSync(database);

  var footprint;
  if (note) {
    footprint = '' + Date.now() + '-' + note + '.js';
  } else {
    footprint = '' + Date.now() + '.js';
  }

  var step = path.join(database, footprint);
  if (fs.existsSync(step))
    throw Error(
      'You or some others save the same steps or you put this command in a loop'
    );

  fs.writeFile(step, calcStep(database), (err) => {
    if (err)
      throw err;
  });

  info(footprint + ' is created');
}

function main() {
  try {
    warn('Make sure run this under you project directory!!');
    var args = defineOptions();
    if (!args.dir || args.dir.length === 0) {
      error('You should indicate 1 directory at least!');
      return;
    }

    if (_.uniq(args.dir).length !== args.dir.length) {
      error('You\'ve just input same directories. Check the -d');
      return;
    }

    if (args.merge) {
      var steps = args.dir.reduce((loaded, dir) => {
        return loaded.concat(
          readSteps(dir).map((step) => path.join(dir, step))
        );
      }, []);

      if (steps.length === 0) {
        warn('No step loaded');
        return;
      }

      mergeSteps(args.dir[0], steps);
      return;
    }

    if (args.compact) {
      error('To be implemented!');
      return;
    }

    if (args.validate) {
      validate(args.dir);
      info('Fine!');
      return;
    }

    if (fs.existsSync(args.dir[0])) validate(args.dir);
    createStep(args.dir[0], args.name);
  } catch (err) {
    error(err.stack);
  }
}

main();
