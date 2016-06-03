'use strict';

function toArray(obj) {
  return Array.isArray(obj) ? obj : [obj];
}

function seqPromise(promises, prevPromise) {
  return promises.reduce((previous, p) => {
    if (!(p instanceof Promise))
      throw new Error('Anything in seqPromise have to be a Promise');

    if (!previous) return p;
    return previous.then(() => p);
  }, prevPromise || null);
}


function chainPromise(promises, prevPromise) {
  return promises.reduce((previous, func) => {
    if (!previous) {
      if (func instanceof Promise) return func;
      if (typeof func !== 'function')
        throw new Error('Sth you want to chain have to be function could figure\
         out a Promise.');
      var bePromise = func();
      if (!(bePromise instanceof Promise))
        throw new Error('Sth you want to chain have to be function could figure\
       out a Promise.');
      return bePromise;
    }

    if (typeof func !== 'function')
      throw new Error('Sth you want to chain have to be function could figure\
       out a Promise.');

    return previous.then(function() {
      return func.apply(null, arguments);
    });
  }, prevPromise || null);
}

// function sequentialPromise(promises, prevPromise) {
//   return promises.reduce((previous, p) => {
//     if (!previous) return p;
//     return previous.then(() => p);
//   }, prevPromise || null);
// }

module.exports = {
  toArray,
  seqPromise,
  chainPromise
};
