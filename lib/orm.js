'use strict';

var dml = require('./dml');
var ddl = require('./ddl');
var datatype = require('./ddl/datatype');
var logger = require('./logger');
var engines = require('./engine/connector');
var _ = require('lodash');

exports = module.exports = function(options) {
	return new ORM(options);
};

_.assign(exports, datatype);

function ORM(options) {
	if (!options.tag) {
		throw Error('An unique tag is requisite!');
	}

	this.options = options;
	this.schemas = [];
	logger();
	_.assign(this, logger);
	_.assign(this, engines);
	_.assign(this, dml);
	_.assign(this, ddl);
}
