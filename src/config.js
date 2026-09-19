import { readFileSync } from "node:fs";

function numberFromEnvironment(name, fallback) {
  const value = Number(process.env[name] ?? fallback);

  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${name} must be a non-negative number`);
  }

  return value;
}

function requiredFromEnvironment(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required`);
  }

  return value;
}

function readSecretFile(environmentVariableName) {
  const filePath = requiredFromEnvironment(environmentVariableName);

  let value;

  try {
    value = readFileSync(filePath, "utf8");
  } catch {
    throw new Error(
      `Unable to read secret file configured by ${environmentVariableName}`
    );
  }

  if (value.length === 0) {
    throw new Error(
      `Secret file configured by ${environmentVariableName} is empty`
    );
  }

  return value;
}

function loadDatabaseUrl() {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  const usernameFile = process.env.DB_USERNAME_FILE;
  const passwordFile = process.env.DB_PASSWORD_FILE;

  /*
   * Local-development fallback.
   *
   * If no CSI secret-file configuration exists, retain the
   * developer handoff behaviour.
   */
  if (!usernameFile && !passwordFile) {
    return "postgresql://orderflow:local-development-only@localhost:5432/orderflow";
  }

  if (!usernameFile || !passwordFile) {
    throw new Error(
      "DB_USERNAME_FILE and DB_PASSWORD_FILE must be configured together"
    );
  }

  const username = readSecretFile("DB_USERNAME_FILE");
  const password = readSecretFile("DB_PASSWORD_FILE");

  const host = requiredFromEnvironment("DB_HOST");
  const port = numberFromEnvironment("DB_PORT", 5432);
  const databaseName = process.env.DB_NAME ?? "orderflow";

  const encodedUsername = encodeURIComponent(username);
  const encodedPassword = encodeURIComponent(password);
  const encodedDatabaseName = encodeURIComponent(databaseName);

  return `postgresql://${encodedUsername}:${encodedPassword}@${host}:${port}/${encodedDatabaseName}?sslmode=require`;
}

export function loadConfig() {
  return {
    databaseUrl: loadDatabaseUrl(),
    logLevel: process.env.LOG_LEVEL ?? "info",
    apiPort: numberFromEnvironment("API_PORT", 3000),
    workerHealthPort: numberFromEnvironment("WORKER_HEALTH_PORT", 3001),
    workerPollIntervalMs: numberFromEnvironment(
      "WORKER_POLL_INTERVAL_MS",
      1000
    ),
    workerProcessingDelayMs: numberFromEnvironment(
      "WORKER_PROCESSING_DELAY_MS",
      1500
    ),
    workerClaimTimeoutMs: numberFromEnvironment(
      "WORKER_CLAIM_TIMEOUT_MS",
      60000
    )
  };
}
