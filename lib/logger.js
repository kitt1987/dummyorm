'use strict';

var colors = require('colors');

class Logger {
  constructor(options) {
    if (!options.logger) return;
    if (typeof options.logger.info !== 'function' ||
      typeof options.logger.warn !== 'function' ||
      typeof options.logger.error !== 'function')
      throw new Error('Custom logger have to define {info|warn|error}(log)');

    if (options.logger)
      this.proto = options.logger;
  }

  info(log) {
    if (this.proto) {
      this.proto.info(log);
      return;
    }

    console.log(log);
  }

  warn(log) {
    if (this.proto) {
      this.proto.warn(log);
      return;
    }

    console.warn(colors.yellow(log));
  }

  error(log) {
    if (this.proto) {
      this.proto.error(log);
      return;
    }

    console.error(colors.red(log));
  }
}

module.exports = Logger;
