'use strict'

var winston = require('winston');

exports = module.exports = function() {
	winston.remove(winston.transports.Console);
}

exports.enableFileLog = function(logFile, logLevel) {
	winston.add(winston.transports.File, {
		filename: logFile,
		level: logLevel
	});
}

exports.enableCliLog = function() {
	winston.add(winston.transports.Console);
}
