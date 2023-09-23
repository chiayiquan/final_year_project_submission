/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable("metamaskDonations", function (table) {
    table.string("id", 32).notNullable().primary();
    table.bigInteger("amount").unsigned().notNullable();
    table.bigInteger("createdAt").unsigned().notNullable();
    table.string("contractId", 32).notNullable();
    table.string("userId", 32).notNullable();
    table.foreign("userId").references("id").inTable("users");
    table.foreign("contractId").references("id").inTable("contracts");
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {};
