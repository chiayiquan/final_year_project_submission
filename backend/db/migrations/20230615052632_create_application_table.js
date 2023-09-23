/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable("applications", function (table) {
    table.string("id", 32).notNullable().primary();
    table.string("status").notNullable();
    table.string("type").notNullable();
    table.string("appliedCountry").notNullable();
    table.string("userId", 42).notNullable();
    table.bigInteger("createdAt").unsigned().notNullable();
    table.foreign("appliedCountry").references("code").inTable("countries");
    table.foreign("userId").references("id").inTable("users");
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {};
