/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable("vouchers", function (table) {
    table.string("id", 32).notNullable().primary();
    table.string("status").notNullable();
    table.string("owner").notNullable();
    table.float("value").unsigned().notNullable();
    table.bigInteger("voucherId").unsigned().nullable();
    table.string("contractId", 32).notNullable();
    table.bigInteger("createdAt").unsigned().notNullable();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {};
