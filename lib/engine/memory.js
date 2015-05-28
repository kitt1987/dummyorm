'use strict'

exports = module.exports = {
	engine: Memory
}

function Memory(properties) {

}

Memory.prototype.connect = function(cb) {
	cb();	
}