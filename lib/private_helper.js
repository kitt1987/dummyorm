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
        value: function(func) {
          var args = Array.prototype.slice.call(arguments, 1);
          return function() {
            return func.apply(
              self,
              Array.prototype.concat(args, Array.from(arguments))
            );
          };
        }
      }
    });
  }
}

module.exports = PrivateFuncHelper;
