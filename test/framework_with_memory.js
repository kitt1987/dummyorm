'use strict'

var ormhelper = require('../');

module.exports = {
	setUp: function(cb) {
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
	firstTest: function(test) {
		test.expect(1);
		test.ok(true, 'Should go');
		test.done();
	}
}