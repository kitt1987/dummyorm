'use strict';

// var DML = require('./dml');
var Condition = require('./dml/condition');
var Logger = require('./logger');
var Connector = require('./ddl/connector');
// var Schema = require('./schema');

// function composite(classA, classB, instanceB) {
//   Object.assign(classA.prototype, Object.keys(classB.prototype)
//     .filter((k) => k !== 'constructor').reduce(
//       (obj, k) => {
//         obj[k] = () => classB.prototype[k].apply(instanceB, arguments);
//         return obj;
//       }, {}));
// }

// var Promise = require('bluebird');
// Promise.config({
//   warnings: true,
//   longStackTraces: true,
//   cancellation: true,
//   monitoring: true
// });

// process.on('promiseCreated', function(promise, child) {
//   console.log('promiseCreated');
//   console.log(arguments);
//   // promise - The parent promise the child was chained from
//   // child - The created child promise.
// });

process.on('promiseChained', function(promise, child) {
  // promise - The parent promise the child was chained from
  // child - The created child promise.
  console.log('promiseChained');
  console.log(arguments);
});

// process.on('promiseFulfilled', function(promise, child) {
//   // promise - The parent promise the child was chained from
//   // child - The created child promise.
//   console.log('promiseFulfilled');
//   console.log(arguments);
// });
//
// process.on('promiseRejected', function(promise, child) {
//   // promise - The parent promise the child was chained from
//   // child - The created child promise.
//   console.log('promiseRejected');
//   console.log(arguments);
// });
//
process.on('promiseResolved', function(promise, child) {
  // promise - The parent promise the child was chained from
  // child - The created child promise.
  console.log('promiseResolved');
  console.log(arguments);
});
//
// process.on('promiseCancelled', function(promise, child) {
//   // promise - The parent promise the child was chained from
//   // child - The created child promise.
//   console.log('promiseCancelled');
//   console.log(arguments);
// });

class ORM {
  constructor(options) {
    if (!options.tag) throw Error('An unique tag is requisite!');

    this.options = options;
    this.schema = {};
    // logger(options);
    this.logger = new Logger(options);
    // composite(ORM, Logger, this.logger);

    this.connector = new Connector(this.logger);

    // this.dml = new DML(this.connector);
    // composite(ORM, DML, this.dml);
  }

  static $() {
    return Condition.$(arguments);
  }

  getSchema(name) {
    return this.schema[name];
  }

  connect() {
    return this.connector.connect(this.options)
      .then((schemas) => {
        this.schema = schemas;
      })
      .catch((err) => {
        this.logger.error(err.stack);
        process.exit(1);
      });
  }

  disconnect() {
    this.connector.disconnect();
  }
}

module.exports = ORM;
