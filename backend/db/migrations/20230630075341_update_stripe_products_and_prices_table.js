/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return Promise.all([
    knex.schema.alterTable("stripeProductPrices", function (table) {
      table.string("stripePriceId").notNullable();
    }),
    knex.schema.alterTable("stripeProducts", function (table) {
      table.string("stripeProductId").notNullable();
    }),
  ]);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {};
