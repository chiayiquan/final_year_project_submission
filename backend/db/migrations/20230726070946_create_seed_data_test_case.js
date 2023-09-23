const stripeProductPrices = require("../../src/utilities/stripeProductPrices.json");
const stripeProducts = require("../../src/utilities/stripeProducts.json");

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  if (process.env.NODE_ENV === "test")
    return Promise.all([
      knex("stripeProducts").insert(stripeProducts),
      knex("stripeProductPrices").insert(stripeProductPrices),
    ]);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {};
