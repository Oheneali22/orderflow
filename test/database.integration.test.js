import test from "node:test";
import assert from "node:assert/strict";
import { migrate } from "../src/database/migrate.js";
import { createOrderRepository } from "../src/database/order-repository.js";
import { createPool } from "../src/database/pool.js";

const databaseUrl = process.env.TEST_DATABASE_URL;

test("PostgreSQL stores and processes an order transactionally", { skip: !databaseUrl }, async () => {
  const pool = createPool(databaseUrl);
  await migrate(pool);
  const repository = createOrderRepository(pool);
  let order;

  try {
    order = await repository.createOrder([{ productId: "keyboard", quantity: 2 }]);
    assert.equal(order.status, "PENDING");
    assert.equal(order.totalCents, 17_800);

    const job = await repository.claimNextJob();
    assert.equal(job.orderId, order.id);
    assert.equal((await repository.getOrder(order.id)).status, "PROCESSING");

    await repository.completeJob(job);
    assert.equal((await repository.getOrder(order.id)).status, "COMPLETED");
  } finally {
    if (order) await pool.query("DELETE FROM orders WHERE id = $1", [order.id]);
    await pool.end();
  }
});

test("PostgreSQL reclaims a job after its worker lease expires", { skip: !databaseUrl }, async () => {
  const pool = createPool(databaseUrl);
  await migrate(pool);
  const repository = createOrderRepository(pool, { claimTimeoutMs: 1000 });
  let order;
  try {
    order = await repository.createOrder([{ productId: "mouse", quantity: 1 }]);
    const firstClaim = await repository.claimNextJob();
    assert.equal(firstClaim.orderId, order.id);

    await pool.query(
      "UPDATE order_jobs SET claimed_at = NOW() - INTERVAL '2 seconds' WHERE id = $1",
      [firstClaim.id]
    );
    const reclaimed = await repository.claimNextJob();
    assert.deepEqual(reclaimed, firstClaim);
    await repository.completeJob(reclaimed);
  } finally {
    if (order) await pool.query("DELETE FROM orders WHERE id = $1", [order.id]);
    await pool.end();
  }
});
