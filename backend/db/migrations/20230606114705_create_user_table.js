const bcrypt = require("bcrypt");

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable("users", function (table) {
    table.string("id", 42).notNullable().primary();
    table.string("name").notNullable();
    table.string("email").notNullable();
    table.string("password").notNullable();
    table.string("role").notNullable();
    table.bigInteger("createdAt").unsigned().notNullable();
  });
  return knex
    .insert({
      id: "0x963EFAb61B9550bcE1017Dc08DACA02B434b5796",
      name: "admin",
      email: "sharethemealadmin@example.com",
      password: await bcrypt.hash("123456789", 11),
      role: "ADMIN",
      createdAt: Date.now(),
    })
    .into("users");
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {};
