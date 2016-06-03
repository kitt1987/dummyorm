'use strict';

class Record {
  constructor(schema, columns) {
    Object.defineProperty(this, 'schemaName', {
      value: schema.tableName
    });
    Object.defineProperty(this, 'pendingColumns', {
      value: {},
      writable: true,
    });
    Object.defineProperty(this, 'values', {
      value: {},
      writable: true,
    });
    schema.getAllColumns().map((column) => {
      Object.defineProperty(this, column.name, {
        configurable: true,
        get: () => this.values[column.name],
        set: (v) => {
          this.values[column.name] = v;
          this.pendingColumns[column.name] = v;
        }
      });
    });
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
