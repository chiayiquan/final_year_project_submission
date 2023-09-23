/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable("applicationFiles", function (table) {
    table.string("id", 32).notNullable().primary();
    table.string("name").notNullable();
    table.string("fileType").notNullable();
    table.string("applicationId", 32).notNullable();
    table.foreign("applicationId").references("id").inTable("applications");
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {};
