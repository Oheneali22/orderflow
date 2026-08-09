import test from "node:test";
import assert from "node:assert/strict";
import { createProcessor } from "../src/worker/processor.js";

const logger = { info: () => {}, error: () => {} };

test("returns false when no job is available", async () => {
  const processor = createProcessor({
    repository: { claimNextJob: async () => null },
    logger,
    processingDelayMs: 0
  });
  assert.equal(await processor(), false);
});

test("completes a claimed job", async () => {
  let completed;
  const job = { id: "job-1", orderId: "order-1" };
  const processor = createProcessor({
    repository: {
      claimNextJob: async () => job,
      completeJob: async (value) => { completed = value; },
      failJob: async () => {}
    },
    logger,
    processingDelayMs: 0
  });
  assert.equal(await processor(), true);
  assert.deepEqual(completed, job);
});

test("marks a job failed when processing throws", async () => {
  let failed;
  const job = { id: "job-1", orderId: "order-1" };
  const processor = createProcessor({
    repository: {
      claimNextJob: async () => job,
      completeJob: async () => { throw new Error("simulated failure"); },
      failJob: async (value) => { failed = value; }
    },
    logger,
    processingDelayMs: 0
  });
  assert.equal(await processor(), true);
  assert.deepEqual(failed, job);
});
