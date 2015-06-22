'use strict'

var dml = require('./dml');
var ddl = require('./ddl');
var datatype = require('./ddl/datatype');
var logger = require('./logger');
var engines = require('./engine/connector');
var _ = require('lodash');

exports = module.exports = function() {
	return new ORM();
}

_.assign(exports, datatype);

function ORM() {
	logger();
	_.assign(this, logger);
	_.assign(this, engines);
	_.assign(this, dml);
	_.assign(this, ddl);
}
