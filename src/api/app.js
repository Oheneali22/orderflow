import express from "express";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { createApiMetrics } from "./metrics.js";

const orderSchema = z.object({
  products: z.array(
    z.object({
      productId: z.string().min(1).max(80),
      quantity: z.number().int().min(1).max(20)
    })
  ).min(1).max(20)
}).superRefine((value, context) => {
  const ids = value.products.map((item) => item.productId);
  if (new Set(ids).size !== ids.length) {
    context.addIssue({ code: "custom", message: "Each product may appear only once" });
  }
});

export function createApp({ repository, pool, logger }) {
  const app = express();
  const metrics = createApiMetrics();
  app.disable("x-powered-by");
  app.use(express.json({ limit: "32kb" }));

  app.use((request, response, next) => {
    const requestId = request.header("x-request-id") ?? randomUUID();
    response.setHeader("x-request-id", requestId);
    request.log = logger.child({ requestId });
    const stopTimer = metrics.httpDuration.startTimer();
    response.on("finish", () => {
      const route = request.route?.path ?? request.path;
      stopTimer({ method: request.method, route, status_code: response.statusCode });
      request.log.info({ method: request.method, path: request.path, statusCode: response.statusCode }, "request_completed");
    });
    next();
  });

  app.get("/health", (_request, response) => response.json({ status: "ok", service: "orderflow-api" }));
  app.get("/health/live", (_request, response) => response.json({ status: "alive" }));
  app.get("/health/ready", async (_request, response) => {
    try {
      await pool.query("SELECT 1");
      response.json({ status: "ready", database: "connected" });
    } catch {
      response.status(503).json({ status: "not_ready", database: "disconnected" });
    }
  });
  app.get("/metrics", async (_request, response) => {
    response.type(metrics.registry.contentType).send(await metrics.registry.metrics());
  });
  app.get("/products", async (_request, response, next) => {
    try {
      response.json(await repository.listProducts());
    } catch (error) {
      next(error);
    }
  });
  app.post("/orders", async (request, response, next) => {
    const parsed = orderSchema.safeParse(request.body);
    if (!parsed.success) {
      return response.status(400).json({ error: "Invalid order", details: parsed.error.issues });
    }
    try {
      const order = await repository.createOrder(parsed.data.products);
      request.log.info({ orderId: order.id }, "order_created");
      return response.status(202).location(`/orders/${order.id}`).json(order);
    } catch (error) {
      if (error.code === "INVALID_PRODUCTS") {
        return response.status(400).json({ error: error.message });
      }
      return next(error);
    }
  });
  app.get("/orders/:id", async (request, response, next) => {
    try {
      const order = await repository.getOrder(request.params.id);
      if (!order) return response.status(404).json({ error: "Order not found" });
      return response.json(order);
    } catch (error) {
      return next(error);
    }
  });
  app.use((error, request, response, _next) => {
    void _next;
    request.log?.error({ err: error }, "request_failed");
    response.status(500).json({ error: "Internal server error" });
  });
  return app;
}
