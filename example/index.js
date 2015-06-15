'use strict'

var ormcache = require('ormcache');

ormcache.useMemoryCache();
ormcache.useRedisCache({
	server: 'ip:port'
}, function(err) {});

ormcache.useMysql({
	server: 'ip:port',
	user: 'user:password'
}, function(err) {});

var User = ormcache.define('table_name_user', {
	// ID, update_ts will be default columns
	name: {
		type: 'string',
		text_len: 32,
		not_null: true
	}
}).sync(function(err) {});

User.buildIndex([User.id, User.name], function(err) {});

var Profile = ormcache.define('table_name_profile', {
	name: {
		type: 'string',
		not_null: true
	}
}).belongs_to(User).sync(function(err) {});

ormcache.join(User, Profile, function(err) {});

var user = User.create({
	name: 'xxx'
});

ormcache.save(key, user, function(error, saved_obj) {});

ormcache.update(key, user, {
	name: 'yyy'
}, function(error, new_obj) {});

ormcache.transaction([
	function(cb) {
		var profile = Profile.create({
			phone: 123456789,
			addr: 'Road'
		});
		ormcache.save(null, profile, cb);
	},
	function(cb, saved_profile) {
		ormcache.update(key, user, {
			profile: saved_profile
		}, cb);
	}
], function(err) {});

ormcache.query()
	.where('condition')
	.offset(1)
	.limit(10)
	.groupBy('id')
	.orderBy('name')
	.exec(function(err, objs) {

	});

ormcache.get(key, function(err, obj) {});
ormcache.cache(key, value, function(err) {});
ormcache.flush(key, function(err) {});
ormcache.drop(key, user, function(err) {});