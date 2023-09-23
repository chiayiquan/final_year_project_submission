/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable("stripeDonations", function (table) {
    table.string("id", 32).notNullable().primary();
    table.bigInteger("amount").unsigned().notNullable();
    table.bigInteger("createdAt").unsigned().notNullable();
    table.string("status").notNullable();
    table.string("stripeReferenceId").notNullable();
    table.string("productId", 32).notNullable();
    table.string("userId", 32).notNullable();
    table.foreign("productId").references("id").inTable("stripeProducts");
    table.foreign("userId").references("id").inTable("users");
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {};
