/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable("transfers", function (table) {
    table.string("id", 32).notNullable().primary();
    table.bigInteger("value").unsigned().notNullable();
    table.bigInteger("createdAt").unsigned().notNullable();
    table.string("transferType").notNullable();
    table.string("from", 42).notNullable();
    table.string("to", 42).notNullable();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {};
