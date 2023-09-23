import knex from "knex";
import env from "./env";
import uuid from "uuid-random";
import pg from "pg";

// https://github.com/brianc/node-pg-types
// pg returns bigInteger as string
// so we cast it to number
pg.types.setTypeParser(pg.types.builtins.INT8, function (val: string): number {
  return parseInt(val);
});

const db = knex({
  client: "pg",
  connection: {
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
  },
});

// Generate a universal unique string ID
export function generateID(): string {
  return uuid().replace(/-/g, ""); // remove all the -
}

export default db;
