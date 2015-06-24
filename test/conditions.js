'use strict'

var $ = require('../lib/dml/condition').$;
var Column = require('../lib/schema').Column;
var Datatype = require('../lib/ddl/datatype');

process.on('uncaughtException', function(err) {
	console.error(err.stack);
});

module.exports = {
	simple: function(test) {
		test.equal('a>b ', $('a>b'));
		test.equal('a > b ', $('a', '>', 'b'));
		test.done();
	},
	column: function(test) {
		var c = new Column({
			schema: {
				tableName: 'schema'
			},
			name: 'Name',
			type: Datatype.String
		});
		test.equal('schema.Name = \'a\' ', $(c, '=', 'a'));
		test.equal('schema.Name =\'a\' ', $(c, '=\'a\''));
		var c2 = new Column({
			schema: {
				tableName: 'schema'
			},
			name: 'age',
			type: Datatype.Integer
		});
		test.equal('schema.Name = \'a\' AND( schema.age >10 ) ',
			$(c, '=', 'a', 'AND(', c2, '>10', ')'));
		test.done();
	},
	nesting: function(test) {
		test.equal('a > b AND a>b  ', $('a', '>', 'b', 'AND', $('a>b')));
		test.done();
	}
}