export function createProcessor({ repository, logger, processingDelayMs }) {
  return async function processOne() {
    const job = await repository.claimNextJob();
    if (!job) return false;
    logger.info({ jobId: job.id, orderId: job.orderId }, "order_processing_started");
    try {
      await new Promise((resolve) => setTimeout(resolve, processingDelayMs));
      await repository.completeJob(job);
      logger.info({ jobId: job.id, orderId: job.orderId }, "order_processing_completed");
    } catch (error) {
      await repository.failJob(job);
      logger.error({ err: error, jobId: job.id, orderId: job.orderId }, "order_processing_failed");
    }
    return true;
  };
}
