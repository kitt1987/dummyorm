'use strict';

class Record {
  constructor(schema, columns) {
    // FIXME make it constant and unenumerable
    this.schemaName = schema.tableName;
    Object.assign(this, columns);
  }

  drop(fields) {
    Object.keys(fields).forIn((field) => {
      if (!this[field])
        throw new Error(
          'The column you want to drop is not exist, which is ' + field
        );
      delete this[field];
    });
  }
}

module.exports = Record;
