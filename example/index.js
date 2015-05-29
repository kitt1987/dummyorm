'use strict'

var ormhelper = require('ormhelper');
var async = require('async');

var orm = ormhelper();

function setEngines(cb) {
	var lowLevel = 'mysql',
		highLevel = 'redis';

	orm.setEngine({
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
	}).connect(function(error) {
		if (error) {
			cb(error, null);
			return;
		}

		cb(null, null);
	});
}

function createUseSchema(cb) {
	var user = orm.define('table_name_user', {
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
	});

	user.sync(function(error) {
		if (error) {
			cb(error, null);
			return;
		}

		cb(null, user);
	});
}

function createProfileSchema(cb) {
	var profile = orm.define('table_name_profile', {
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
	}).set({
		belongs_to: User,
		no_l2: true
	});

	profile.sync(function(error) {
		if (error) {
			cb(error, null);
			return;
		}

		cb(null, profile);
	});
}

var User, Profile;

async.series({
	t1: setEngines,
	user: createUseSchema,
	profile: createProfileSchema
}, function(error, schemas) {
	if (error)
		throw error;
	User = schemas.user;
	Profile = schemas.profile;
});

function buildIndeciesForUser(cb) {
	User.buildIndex([User.id, User.name], function(error) {
		if (error) {
			cb(error, null);
			return;
		}

		cb(null, null);
	});
}

async.series([buildIndeciesForUser], function(error, results) {
	if (error)
		throw error;
});

var user = User.create({
	name: 'xxx'
});

user.save(function(error, saved_obj) {
	user = saved_obj;
});

user.update({
	name: 'yyy'
}, function(error) {
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

User.query
	.where('condition')
	.offset(1)
	.limit(10)
	.group_by('id')
	.order_by('name')
	.desc()
	.toplevelOnly()
	.exec(function(error, objs) {

	});

User.dropRecord(id, function(error) {

});

User.dropRecord(function(error) {
	// Drop all records
});

User.drop(function(error) {
	console.log('Fail to drop schema user|' + error);
});
