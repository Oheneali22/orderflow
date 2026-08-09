import { randomUUID } from "node:crypto";
import { ORDER_STATES } from "../shared/order-states.js";

function serializeOrder(row, items) {
  return {
    id: row.id,
    status: row.status,
    totalCents: row.total_cents,
    products: items.map((item) => ({
      id: item.product_id,
      name: item.product_name,
      unitPriceCents: item.unit_price_cents,
      quantity: item.quantity,
      lineTotalCents: item.line_total_cents
    })),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function createOrderRepository(pool, { claimTimeoutMs = 60000 } = {}) {
  return {
    async listProducts() {
      const result = await pool.query(
        "SELECT id, name, price_cents FROM products WHERE active = TRUE ORDER BY name"
      );
      return result.rows.map((row) => ({
        id: row.id,
        name: row.name,
        priceCents: row.price_cents
      }));
    },

    async createOrder(requestedProducts) {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const ids = requestedProducts.map((item) => item.productId);
        const productsResult = await client.query(
          "SELECT id, name, price_cents FROM products WHERE active = TRUE AND id = ANY($1::text[])",
          [ids]
        );
        const productsById = new Map(productsResult.rows.map((row) => [row.id, row]));
        const missing = ids.filter((id) => !productsById.has(id));
        if (missing.length > 0) {
          const error = new Error(`Unknown or inactive products: ${missing.join(", ")}`);
          error.code = "INVALID_PRODUCTS";
          throw error;
        }

        const items = requestedProducts.map((item) => {
          const product = productsById.get(item.productId);
          return {
            productId: product.id,
            productName: product.name,
            unitPriceCents: product.price_cents,
            quantity: item.quantity,
            lineTotalCents: product.price_cents * item.quantity
          };
        });
        const totalCents = items.reduce((sum, item) => sum + item.lineTotalCents, 0);
        const orderId = randomUUID();

        const orderResult = await client.query(
          `INSERT INTO orders (id, status, total_cents)
           VALUES ($1, $2, $3)
           RETURNING *`,
          [orderId, ORDER_STATES.PENDING, totalCents]
        );
        for (const item of items) {
          await client.query(
            `INSERT INTO order_items
              (order_id, product_id, product_name, unit_price_cents, quantity, line_total_cents)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
              orderId,
              item.productId,
              item.productName,
              item.unitPriceCents,
              item.quantity,
              item.lineTotalCents
            ]
          );
        }
        await client.query(
          "INSERT INTO order_jobs (id, order_id, status) VALUES ($1, $2, 'PENDING')",
          [randomUUID(), orderId]
        );
        await client.query("COMMIT");
        return serializeOrder(orderResult.rows[0], items.map((item) => ({
          product_id: item.productId,
          product_name: item.productName,
          unit_price_cents: item.unitPriceCents,
          quantity: item.quantity,
          line_total_cents: item.lineTotalCents
        })));
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    },

    async getOrder(orderId) {
      const orderResult = await pool.query("SELECT * FROM orders WHERE id = $1", [orderId]);
      if (orderResult.rowCount === 0) return null;
      const itemsResult = await pool.query(
        "SELECT * FROM order_items WHERE order_id = $1 ORDER BY product_name",
        [orderId]
      );
      return serializeOrder(orderResult.rows[0], itemsResult.rows);
    },

    async claimNextJob() {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const result = await client.query(`
          SELECT id, order_id
          FROM order_jobs
          WHERE
            (status = 'PENDING' AND available_at <= NOW())
            OR
            (status = 'CLAIMED' AND claimed_at <= NOW() - ($1 * INTERVAL '1 millisecond'))
          ORDER BY created_at
          FOR UPDATE SKIP LOCKED
          LIMIT 1
        `, [claimTimeoutMs]);
        if (result.rowCount === 0) {
          await client.query("COMMIT");
          return null;
        }
        const job = result.rows[0];
        await client.query(
          `UPDATE order_jobs
           SET status = 'CLAIMED', attempts = attempts + 1, claimed_at = NOW(), updated_at = NOW()
           WHERE id = $1`,
          [job.id]
        );
        await client.query(
          "UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2",
          [ORDER_STATES.PROCESSING, job.order_id]
        );
        await client.query("COMMIT");
        return { id: job.id, orderId: job.order_id };
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    },

    async completeJob(job) {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        await client.query(
          "UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2",
          [ORDER_STATES.COMPLETED, job.orderId]
        );
        await client.query(
          "UPDATE order_jobs SET status = 'COMPLETED', updated_at = NOW() WHERE id = $1",
          [job.id]
        );
        await client.query("COMMIT");
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    },

    async failJob(job) {
      await pool.query(
        `WITH failed_order AS (
           UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2
         )
         UPDATE order_jobs SET status = 'FAILED', updated_at = NOW() WHERE id = $3`,
        [ORDER_STATES.FAILED, job.orderId, job.id]
      );
    }
  };
}
