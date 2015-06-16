'use strict'

var Condition = require('../lib/dml/condition');

process.on('uncaughtException', function(err) {
	console.error(err.stack);
});

module.exports = {
	simpleNumber: function(test) {
		var c = new Condition();
		test.throws(function() {
			c.gt('aaa', 1);
		});
		test.throws(function() {
			c.gt(1, 'bbb');
		});
		test.done();
	},
	simpleString: function(test) {
		var c = new Condition();
		test.equal('key=\'value\'', c.eq('key', 'value').sql);
		test.done();
	},
	simpleAnd: function(test) {
		var c1 = new Condition();
		c1.eq('key1', 'value1');
		var c2 = new Condition();
		c2.eq('key2', 'value2');
		var c3 = new Condition();
		c3.gt(1, 3);
		c1.and(c2, c3);
		test.equal('key1=\'value1\' AND (key2=\'value2\' AND 1>3)', c1.sql);
		test.done();
	}
}