'use strict';

var _ = require('lodash');
var Join = require('./join');
var util = require('util');
var $ = require('./condition').$;

exports = module.exports = Updater;

function Updater(engine, main_table) {
	this.engine = engine;
	if (main_table)
		this._table = _.uniq(main_table).join(',');
}

Join.makeJoinable(Updater.prototype);

Updater.prototype.where = function(condition) {
	this._where = condition;
	return this;
};

Updater.prototype.set = function(k, v) {
	if (!this._set) {
		this._set = [$(k, '=', v)];
	} else {
		this._set.push($(k, '=', v));
	}

	return this;
}

Updater.prototype.exec = function(cb) {
	if (!this._table) {
		cb(new Error('You should call orm.updater(Schema)'));
		return;
	}

	if (!this._set) {
		cb(new Error('You should call orm.updater(Schema).set(Schema.Column, value).'));
		return;
	}

	var sql = util.format('UPDATE %s', this._table);
	if (this._join) {
		sql += ' ' + this._join;
	}

	if (this._where)
		sql += ' WHERE ' + this._where;

	sql += ' SET ' + this._set.join();

	this.engine.performSQL(sql, cb);
}