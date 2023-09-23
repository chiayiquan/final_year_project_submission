// my-custom-environment
import NodeEnvironment from "jest-environment-node";
import knex, { Knex } from "knex";
import knexConfig from "../db/knexfile";
import { JestEnvironmentConfig, EnvironmentContext } from "@jest/environment";
import env from "../src/env";
const database = env.DB_NAME;

//https://stackoverflow.com/questions/48508847/async-setup-of-environment-with-jest
class TestEnvironment extends NodeEnvironment {
  isolatedDatabase: string;
  testDB: Knex<any, unknown[]>;

  constructor(config: JestEnvironmentConfig, context: EnvironmentContext) {
    super(config, context);
    this.isolatedDatabase = database + "-" + process.env.JEST_WORKER_ID;
    this.testDB = knex({
      ...knexConfig,
      connection: {
        ...knexConfig.connection,
        database: "postgres",
        port: env.DB_PORT,
      },
    });

    // Set this global for setupFiles.js to set process.env.DB_NAME
    // because we can't set the process.env here
    this.global.JEST_ISOLATED_DATABASE = this.isolatedDatabase;
  }

  async setup() {
    await super.setup();
    await createIsolatedDatabase(this.isolatedDatabase, database, this.testDB);
  }

  async teardown() {
    await this.testDB.raw("DROP DATABASE IF EXISTS ??", [
      this.isolatedDatabase,
    ]);
    await this.testDB.destroy();
    await super.teardown();
  }
}

async function createIsolatedDatabase(
  isolatedDatabase: string,
  templateDatabase: string,
  db: Knex<any, unknown[]>
) {
  await db
    .raw("DROP DATABASE IF EXISTS ??", [isolatedDatabase])
    .then(async () =>
      db.raw("CREATE DATABASE ?? TEMPLATE ??", [
        isolatedDatabase,
        templateDatabase,
      ])
    );
}

module.exports = TestEnvironment;
