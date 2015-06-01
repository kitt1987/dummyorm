'use strict'

var ormhelper = require('../');

module.exports = {
	setUp: function(cb) {
		this.table_name = 'user';
		this.orm = ormhelper();
		this.orm.setEngine({
			id: 'memory',
			option: {
				size: '256M'
			}
		}).connect(function(err) {
			if (err) {
				throw err;
			}

			cb();
		});
	},
	tearDown: function(cb) {
		this.orm.disconnect(function(err) {
			if (err)
				throw err;
			cb();
		})
	},
	defineASchema: function(test) {
		var user = this.orm.define(this.table_name, {
			name: {
				type: ormhelper.String,
				len: 32,
				not_null: true
			},
			age: {
				type: ormhelper.TinyInteger,
			}
		});
		user.sync(function(err) {
			test.ok(!err);
			test.done();
		});
	}
}