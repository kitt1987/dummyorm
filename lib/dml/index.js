'use strict';

var Query = require('./query');
var Transaction = require('./transaction');
var Updater = require('./update');
var ddl = require('../ddl/datatype');
var _ = require('lodash');
var u = require('../utility');
var logger = require('../logger');

exports = module.exports = {};

function _updateCache(key, record, cb) {
	var cacheKey = u.applyCacheKey(key, record);
	if (!cacheKey) {
		cb();
		return;
	}

	this.cache.get(cacheKey, function(err, result) {
		if (err) {
			cb(err);
			return;
		}

		if (result && result[ddl.UpdateTsField] >= record[ddl.UpdateTsField]) {
			cb();
			return;
		}

		this.cache.keep(cacheKey, record.dump(), cb);
	}.bind(this));
}

exports.save = function(key, record, cb) {
	record[ddl.UpdateTsField] = _.now();
	var self = this;
	this.storage.insert(record, function(err) {
		if (err) {
			cb(err);
			return;
		}

		if (self.cache && key) {
			_updateCache.call(self, key, record, cb);
		} else {
			cb();
		}
	});
};

exports.update = function(key, record, cb) {
	var theKey = typeof key === 'function' ? key(record.id) : key;
	record[ddl.UpdateTsField] = _.now();
	var self = this;
	this.storage.update(record, function(err) {
		if (err) {
			cb(err);
			return;
		}

		if (self.cache && key) {
			_updateCache.call(self, key, record, cb);
		} else {
			cb();
		}
	});
};

exports.del = function(key, record, cb) {
	var self = this;
	this.storage.del(record, function(err) {
		if (self.cache && key) {
			self.cache.del(key, cb);
		} else {
			cb();
		}
	});
};

// Cache accessor
exports.keep = function(key, obj, cb, lifeTime) {
	if (!this.cache)
		throw new Error('Cache is inactive');
	if (!key) {
		throw new Error('You can not cache an object with no key');
	}

	this.cache.keep(key, obj, cb, lifeTime);
};

exports.get = function(keys, cb) {
	if (!this.cache) {
		cb(new Error('Cache is inactive'));
		return;
	}

	if (!keys || (_.isArray(keys) && _.some(keys, _.isEmpty))) {
		cb();
		return;
	}

	this.cache.get(keys, function(err, result) {
		if (err) {
			cb(err);
			return;
		}

		if (!result || result.length === 0) {
			cb();
			return;
		}

		cb(null, result);
	});
};

exports.set = function(key, obj, cb, lifeTime) {
	if (!this.cache) {
		cb(new Error('Cache is inactive'));
		return;
	}

	this.cache.keep(key, obj, cb, lifeTime);
};

exports.remove = function(key, cb) {
	if (!this.cache) {
		cb(new Error('Cache is inactive'));
		return;
	}

	if (!key) {
		throw new Error('You can not remove an object from cache with no key');
	}

	this.cache.del(key, cb);
};

exports.gets = function(key, cb) {
	if (!this.cache) {
		cb(new Error('Cache is inactive'));
		return;
	}

	this.cache.gets(key, cb);
};

exports.cas = function(key, value, cas, cb, lifeTime) {
	if (!this.cache) {
		cb(new Error('Cache is inactive'));
		return;
	}

	this.cache.cas(key, value, cas, cb, lifeTime);
};

exports.saveArray = function(key, array, cb) {
	if (!this.cache) {
		cb(new Error('Cache is inactive'));
		return;
	}

	if (!_.isArray(array)) {
		this.set(key, array, cb);
		return;
	}

	var v = array.map(function(i) {
		return JSON.stringify(i);
	}).join();
	this.set(key, v, cb, 0);
};

exports.getArray = function(key, cb) {
	if (!this.cache) {
		cb(new Error('Cache is inactive'));
		return;
	}

	this.cache.get(key, function(err, data) {
		if (err) {
			cb(err);
			return;
		}

		if (data[0] === ',') {
			cb(null, JSON.parse('[' + data.slice(1) + ']'));
		} else {
			cb(null, JSON.parse('[' + data + ']'));
		}
	});
};

exports.appendArray = function(key, value, cb) {
	if (!this.cache) {
		cb(new Error('Cache is inactive'));
		return;
	}
	var v = JSON.stringify(value);
	this.cache.append(key, ',' + v, cb);
};

exports.prependArray = function(key, value, cb) {
	if (!this.cache) {
		cb(new Error('Cache is inactive'));
		return;
	}

	var v = JSON.stringify(value);
	this.cache.prepend(key, v + ',', cb);
};

exports.query = function(schema) {
	if (!schema || _.isArray(schema)) {
		throw new Error('You just could fetch record from the same schema in single query');
	}

	return new Query(this, schema);
	// if (schemas) {
	// 	schemas = u.toArray(schemas);
	// 	return new Query(this.storage, schemas);
	// } else {
	// 	return new Query(this.storage);
	// }
};

// exports.updater = function(schemas) {
// 	if (schemas) {
// 		schemas = u.toArray(schemas);
// 		return new Updater(this.storage, _.map(schemas, 'tableName'));
// 	} else {
// 		return new Updater(this.storage);
// 	}
// }

exports.transaction = function() {
	return new Transaction(this, exports);
};
