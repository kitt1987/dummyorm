'use strict'

function toArray(obj) {
  return Array.isArray(obj) ? obj : [obj];
}

function seqPromise(promises, prevPromise) {
  return promises.reduce((previous, p) => {
    if (!previous) return p;
    return previous.then(() => p);
  }, prevPromise || Promise.resolve(false));
}

module.exports = {
  toArray,
  seqPromise
};
