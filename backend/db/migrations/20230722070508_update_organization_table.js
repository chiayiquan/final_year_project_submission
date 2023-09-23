/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return Promise.all([
    knex.schema.alterTable("organizations", function (table) {
      table.dropColumn("address");
    }),
    knex.schema.createTable("addresses", function (table) {
      table.string("id", 32).notNullable().primary();
      table.string("address").notNullable();
      table.string("applicationId").notNullable();
      table.foreign("applicationId").references("id").inTable("applications");
    }),
  ]);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {};
