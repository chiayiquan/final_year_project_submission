/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable("contracts", function (table) {
    table.string("id", 32).notNullable().primary();
    table.string("countryCode").notNullable();
    table.bigInteger("voucherPrice").unsigned().notNullable();
    table.bigInteger("fees").unsigned().notNullable();
    table.bigInteger("createdAt").unsigned().notNullable();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {};
