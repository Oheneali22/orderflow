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
