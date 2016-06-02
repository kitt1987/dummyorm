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

// function sequentialPromise(promises, prevPromise) {
//   return promises.reduce((previous, p) => {
//     if (!previous) return p;
//     return previous.then(() => p);
//   }, prevPromise || null);
// }

module.exports = {
  toArray,
  seqPromise
};
