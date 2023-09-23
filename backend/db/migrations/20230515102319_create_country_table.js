const CountriesJSON = require("../../src/utilities/countries.json");

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable("countries", function (table) {
    table.string("code").notNullable().primary();
    table.string("name").notNullable();
  });
  return knex("countries").insert(CountriesJSON);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {};
