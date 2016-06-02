'use strict';

class PrivateFuncHelper {
  constructor() {
    var self = this;
    Object.defineProperties(this, {
      '_': {
        value: function(func) {
          return func.apply(self, Array.prototype.slice.call(arguments, 1));
        }
      },
      '_bind': {
        value: (func) => {
          return function() {
            return func.apply(self, arguments);
          };
        }
      }
    });
  }
}

module.exports = PrivateFuncHelper;
