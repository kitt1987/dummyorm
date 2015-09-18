'use strict';

var _ = require('lodash');
var async = require('async');
var Mysql = require('../engine/mysql');

exports = module.exports = function(ormcache, proto) {
	this.ctx = {
		cache: ormcache.cache
	};
	this.storage = ormcache.storage;
	this.pendings = [];
	_.forEach(['save', 'update', 'del'], function(m) {
		this[m] = function(key, record) {
			var pending = {
				key: key,
				record: record,
				pending: proto[m]
			};
			this.pendings.push(pending);
			return this;
		};
	}.bind(this));
};

function transCall(conn, cb) {
	this.ctx.storage = new Mysql({
		liveConn: conn
	});
	var self = this;
	var calls = _.map(this.pendings, function(p) {
		return p.pending.bind(self.ctx, p.key, p.record);
	});

	async.series(_.flattenDeep([
		Mysql.prototype.useDB.bind(self.ctx.storage, self.storage.db),
		calls
	]), cb);
}

exports.prototype.exec = function(cb) {
	this.storage.runInTransaction(transCall.bind(this), cb);
};
