import { loadConfig } from "../config.js";
import { migrate } from "../database/migrate.js";
import { createOrderRepository } from "../database/order-repository.js";
import { createPool } from "../database/pool.js";
import { createLogger } from "../shared/logger.js";
import { createApp } from "./app.js";

const config = loadConfig();
const logger = createLogger("orderflow-api", config.logLevel);
const pool = createPool(config.databaseUrl);

await migrate(pool);
const repository = createOrderRepository(pool);
const app = createApp({ repository, pool, logger });
const server = app.listen(config.apiPort, "0.0.0.0", () => {
  logger.info({ port: config.apiPort }, "api_started");
});

async function shutdown(signal) {
  logger.info({ signal }, "api_stopping");
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
