'use strict'

exports.firstTest = function(test) {
	test.expect(1);
	test.ok(true, 'Should go');
	test.done();
}