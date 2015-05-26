'use strict'

var Record = require('./record').Record;

exports = module.exports = {}
exports.Schema = Schema;

function Schema(/* ... */) {

}

Schema.prototype.create = function(properties) {
	return new Record();
}

Schema.prototype.query = function(/* conditions, options, cb */) {

}

Schema.prototype.drop = function(cb) {

}

Schema.prototype.dropRecord = function(/* id, cb */) {

}