/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable("transactions", function (table) {
    table.string("id", 32).notNullable().primary();
    table.string("type").notNullable();
    table.string("status").notNullable();
    table.string("from").notNullable();
    table.string("to").notNullable();
    table.string("contractId").nullable();
    table.bigInteger("amount").unsigned().nullable();
    table.bigInteger("createdAt").unsigned().notNullable();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {};
