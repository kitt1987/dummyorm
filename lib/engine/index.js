'use strict'

exports = module.exports = {
	mysql: require('./mysql').engine,
	redis: require('./redis').engine
}