function numberFromEnvironment(name, fallback) {
  const value = Number(process.env[name] ?? fallback);
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${name} must be a non-negative number`);
  }
  return value;
}

export function loadConfig() {
  return {
    databaseUrl:
      process.env.DATABASE_URL ??
      "postgresql://orderflow:local-development-only@localhost:5432/orderflow",
    logLevel: process.env.LOG_LEVEL ?? "info",
    apiPort: numberFromEnvironment("API_PORT", 3000),
    workerHealthPort: numberFromEnvironment("WORKER_HEALTH_PORT", 3001),
    workerPollIntervalMs: numberFromEnvironment("WORKER_POLL_INTERVAL_MS", 1000),
    workerProcessingDelayMs: numberFromEnvironment("WORKER_PROCESSING_DELAY_MS", 1500)
  };
}
