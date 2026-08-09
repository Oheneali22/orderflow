import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { createApp } from "../src/api/app.js";

const logger = {
  child: () => logger,
  info: () => {},
  error: () => {}
};

function buildApp(overrides = {}) {
  const repository = {
    listProducts: async () => [{ id: "mouse", name: "Wireless Mouse", priceCents: 4900 }],
    createOrder: async () => ({ id: "order-1", status: "PENDING", totalCents: 4900, products: [] }),
    getOrder: async (id) => id === "order-1" ? { id, status: "PENDING" } : null,
    ...overrides
  };
  return createApp({ repository, pool: { query: async () => ({}) }, logger });
}

test("liveness does not require a database", async () => {
  const response = await request(buildApp()).get("/health/live");
  assert.equal(response.status, 200);
  assert.equal(response.body.status, "alive");
});

test("lists products", async () => {
  const response = await request(buildApp()).get("/products");
  assert.equal(response.status, 200);
  assert.equal(response.body[0].id, "mouse");
});

test("accepts a valid order for asynchronous processing", async () => {
  const response = await request(buildApp())
    .post("/orders")
    .send({ products: [{ productId: "mouse", quantity: 1 }] });
  assert.equal(response.status, 202);
  assert.equal(response.body.status, "PENDING");
  assert.equal(response.headers.location, "/orders/order-1");
});

test("rejects an invalid order", async () => {
  const response = await request(buildApp()).post("/orders").send({ products: [] });
  assert.equal(response.status, 400);
  assert.equal(response.body.error, "Invalid order");
});

test("returns 404 for an unknown order", async () => {
  const response = await request(buildApp()).get("/orders/missing");
  assert.equal(response.status, 404);
});
