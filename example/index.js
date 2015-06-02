'use strict'

var ormcache = require('ormcache');

ormcache.useMemoryCache();
ormcache.useRedisCache({
	server: 'ip:port'
}, function(err) {

});

ormcache.useMysql({
	server: 'ip:port',
	user: 'user:password'
}, function(err) {

});

var User = ormcache.define('table_name_user', {
	// ID, create_ts and update_ts will be default columns
	name: {
		type: 'string',
		text_len: 32,
		not_null: true
	}
});

User.sync(function(error) {
});

var Profile = ormcache.define('table_name_profile', {
	name: {
		type: 'string',
		not_null: true
	}
}).set({
	belongs_to: User
});

Profile.sync(function(error) {
});

User.buildIndex([User.id, User.name], function(error) {
});

var user = User.create({
	name: 'xxx'
});

ormcache.save(key, user, function(error, saved_obj) {
});

ormcache.update(key, user, {
	name: 'yyy'
}, function(error, new_obj) {
});

ormcache.drop(key, user, function(error) {
});

// Update or create profile
user.update(Profile, {
	phone: 123456789,
	addr: 'Road'
}, function(error) {
	console.log('Fail to update object|' + error);
});

ormcache.get(key, function(err, obj)) {

}

ormcache.query()
	.where('condition')
	.offset(1)
	.limit(10)
	.groupBy('id')
	.orderBy('name')
	.exec(function(err, objs) {

	});
