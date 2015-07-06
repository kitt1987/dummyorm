'use strict'

var $to = require('colors');

var logger = exports = module.exports = function(options) {
	if (options.logger) {
		logger.proto = options.logger;
	}
};

logger.info = function(log) {
	if (logger.proto) {
		logger.proto.info(log);
		return;
	}

	console.log(log);
};

logger.warn = function(log) {
	if (logger.proto) {
		logger.proto.warn(log);
		return;
	}

	console.warn($to.yellow(log));
};

logger.error = function(log) {
	if (logger.proto) {
		logger.proto.error(log);
		return;
	}

	console.error($to.red(log));
};