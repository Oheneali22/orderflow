import { loadConfig } from "../config.js";
import { createLogger } from "../shared/logger.js";
import { createPool } from "./pool.js";
import { schemaSql } from "./schema.js";

export async function migrate(pool) {
  await pool.query(schemaSql);
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const config = loadConfig();
  const logger = createLogger("orderflow-migrate", config.logLevel);
  const pool = createPool(config.databaseUrl);

  try {
    await migrate(pool);
    logger.info("database_migration_completed");
  } catch (error) {
    logger.error({ err: error }, "database_migration_failed");
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}
