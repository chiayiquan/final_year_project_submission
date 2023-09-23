/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable("stripeProducts", function (table) {
    table.string("id", 32).notNullable().primary();
    table.string("name", 32).notNullable();
    table.string("description", 32).notNullable();
    table.string("countryCode").notNullable();
    table.bigInteger("createdAt").unsigned().notNullable();
    table.foreign("countryCode").references("code").inTable("countries");
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {};
