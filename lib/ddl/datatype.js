'use strict';

exports.IDField = 'id';
exports.UpdateTsField = 'update_ts';

exports.TinyInteger = {
	sql: 'TINYINT',
	js: 'number'
};

exports.Bool = {
	sql: 'BOOL',
	js: 'boolean'
};

exports.SmallInteger = {
	sql: 'SMALLINT',
	js: 'number'
};

exports.MediumInteger = {
	sql: 'MEDIUMINT',
	js: 'number'
};

exports.Integer = {
	sql: 'INT',
	js: 'number'
};

exports.BigInteger = {
	sql: 'BIGINT',
	js: 'number'
};

exports.Float = {
	sql: 'FLOAT',
	js: 'number'
};

exports.Double = {
	sql: 'DOUBLE',
	js: 'number'
};

exports.String = {
	sql: 'VARCHAR',
	js: 'string'
};

exports.Binary = {
	sql: 'BLOB',
	js: 'object' // Buffer
};

exports.Text = {
	sql: 'TEXT',
	js: 'string'
};

exports.SmallBinary = {
	sql: 'TINYBLOB',
	js: 'object' // Buffer
};

exports.MediumBinary = {
	sql: 'MEDIUMBLOB',
	js: 'object' // Buffer
};

exports.LongBinary = {
	sql: 'LONGBLOB',
	js: 'object' // Buffer
};

exports.SmallText = {
	sql: 'TINYTEXT',
	js: 'string'
};

exports.MediumText = {
	sql: 'MEDIUMTEXT',
	js: 'string'
};

exports.LongText = {
	sql: 'LONGTEXT',
	js: 'string'
};

exports.Timestamp = {
	sql: 'TIMESTAMP'
};

exports.BtreeIndex = {
	sql: 'USING BTREE'
};

exports.HashIndex = {
	sql: 'USING HASH'
};

exports.ForeignKey = {
	sql: 'INT',
	js: 'number'
};

exports.JSON = {
	sql: 'VARCHAR',
	js: 'string'
};
