'use strict'

var ormhelper = require('ormhelper');

var orm = ormhelper();

var lowLevel = 'mysql', highLevel = 'redis';

orm.setEngine(
	{
		id: lowLevel,
		option: {
			server: 'localhost',
			port: 3306,
			user: 'root',
			password: 'root',
		}
	}).setEngine({
		id: highLevel,
		option: {
			server: 'localhost',
			port: 3306,
			user: 'root',
			password: 'root',
		}
	});

// Sync & Check
var User = orm.define('table_name_user',
		{
			// ID, create_ts and update_ts will be default columns
			id: {
				type: 'integer',
				byte_len: 32,
				key: true,
				auto_increment: true,
				not_null: true
			},
			name: {
				type: 'string',
				text_len: 32,
				not_null: true
			}
		}, function cb(error) {
			console.log('Fail to define schema user|' + error);
		}
	);

var Profile = orm.define('table_name_profile',
		{
			id: {
				type: 'integer',
				key: true,
				auto_increment: true,
				not_null: true
			},
			name: {
				type: 'string',
				not_null: true
			}
		}, {
			belongs_to: User,
			no_l2: true
		}, function cb(error) {
			console.log('Fail to define schema user|' + error);
		}
	);

User.buildIndex([User.id, User.name], function(error) {
	// ...
});

User.drop(function(error) {
	console.log('Fail to drop schema user|' + error);
});

var user = User.create({ name: 'xxx'});
user.save(function(error, saved_obj) {
	user = saved_obj;
});

user.update({ name: 'yyy'}, function(error) {
	console.log('Fail to update object|' + error);
});

// In transaction with profile
user.drop(function(error) {
	console.log('Fail to drop object|' + error);
});

// Update or create profile
user.update(Profile, {
	phone: 123456789,
	addr: 'Road'
}, function(error) {
	console.log('Fail to update object|' + error);
});

User.query({
	where:
	limit:
	group_by:
	order_by:
}, {
	just_l2: true
}, function(error, objs) {

});

User.dropRecord(id, function(error) {

});

User.dropRecord(function(error) {
	// Drop all records
});