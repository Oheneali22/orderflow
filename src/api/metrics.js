import client from "prom-client";

export function createApiMetrics() {
  const registry = new client.Registry();
  client.collectDefaultMetrics({ register: registry, prefix: "orderflow_api_" });
  const httpDuration = new client.Histogram({
    name: "orderflow_api_http_request_duration_seconds",
    help: "Duration of HTTP requests in seconds.",
    labelNames: ["method", "route", "status_code"],
    registers: [registry]
  });
  return { registry, httpDuration };
}
