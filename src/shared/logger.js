import pino from "pino";

export function createLogger(service, level = "info") {
  return pino({
    level,
    base: { service },
    timestamp: pino.stdTimeFunctions.isoTime
  });
}
