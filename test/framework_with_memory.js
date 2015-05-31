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
		var user = this.orm.define(this.table_name,
			{
				// FIXME test all data types
				name: {
					type: 'string',
					text_len: 32,
					not_null: true
				}
			});
		test.expect(1);
		test.ok(true, 'Should go');
		test.done();
	}
}