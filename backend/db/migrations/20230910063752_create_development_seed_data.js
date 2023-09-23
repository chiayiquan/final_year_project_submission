const exportedData = require("../../src/utilities/exported_data.json");

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  if (process.env.NODE_ENV === "development") {
    const notNullTables = Object.keys(exportedData).reduce(
      (accumulator, currentValue) => {
        if (exportedData[currentValue] != null)
          accumulator[currentValue] = exportedData[currentValue];
        return accumulator;
      },
      {}
    );
    return Promise.all(
      Object.keys(notNullTables).map((key) =>
        knex(key).insert(notNullTables[key])
      )
    );
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {};
