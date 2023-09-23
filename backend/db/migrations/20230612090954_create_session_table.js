/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable("sessions", function (table) {
    table.string("id", 32).notNullable().primary();
    table.string("userId", 42).notNullable();
    table.bigInteger("createdAt").unsigned().notNullable();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {};
