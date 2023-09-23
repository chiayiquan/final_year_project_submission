/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable("organizationMembers", function (table) {
    table.string("id", 32).notNullable().primary();
    table.string("userId", 32).notNullable();
    table.string("organizationId", 32).notNullable();
    table.foreign("userId").references("id").inTable("users");
    table.foreign("organizationId").references("id").inTable("organizations");
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {};
