import express from "express";
import client from "prom-client";
import { loadConfig } from "../config.js";
import { migrate } from "../database/migrate.js";
import { createOrderRepository } from "../database/order-repository.js";
import { createPool } from "../database/pool.js";
import { createLogger } from "../shared/logger.js";
import { createProcessor } from "./processor.js";

const config = loadConfig();
const logger = createLogger("orderflow-worker", config.logLevel);
const pool = createPool(config.databaseUrl);
await migrate(pool);

const registry = new client.Registry();
client.collectDefaultMetrics({ register: registry, prefix: "orderflow_worker_" });
const processed = new client.Counter({
  name: "orderflow_worker_jobs_processed_total",
  help: "Number of jobs claimed by the worker.",
  registers: [registry]
});
const repository = createOrderRepository(pool);
const processOne = createProcessor({
  repository,
  logger,
  processingDelayMs: config.workerProcessingDelayMs
});
let databaseReady = true;
let processing = false;

const timer = setInterval(async () => {
  if (processing) return;
  processing = true;
  try {
    databaseReady = true;
    if (await processOne()) processed.inc();
  } catch (error) {
    databaseReady = false;
    logger.error({ err: error }, "worker_poll_failed");
  } finally {
    processing = false;
  }
}, config.workerPollIntervalMs);

const healthApp = express();
healthApp.disable("x-powered-by");
healthApp.get("/health/live", (_request, response) => response.json({ status: "alive" }));
healthApp.get("/health/ready", (_request, response) => {
  response.status(databaseReady ? 200 : 503).json({ status: databaseReady ? "ready" : "not_ready" });
});
healthApp.get("/metrics", async (_request, response) => {
  response.type(registry.contentType).send(await registry.metrics());
});
const healthServer = healthApp.listen(config.workerHealthPort, "0.0.0.0", () => {
  logger.info({ port: config.workerHealthPort }, "worker_started");
});

async function shutdown(signal) {
  logger.info({ signal }, "worker_stopping");
  clearInterval(timer);
  healthServer.close(async () => {
    await pool.end();
    process.exit(0);
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
