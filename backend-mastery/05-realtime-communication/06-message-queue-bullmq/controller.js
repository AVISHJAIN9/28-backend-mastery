const { Queue } = require('bullmq');
class QueueController {
  constructor(redis) {
    this.queue = new Queue('jobs', { connection: redis });
  }
  async addJob(jobType, data, options = {}) {
    return await this.queue.add(jobType, data, {
      attempts: options.attempts || 3,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: true,
      ...options
    });
  }
  async processJobs() {
    await this.queue.process(async (job) => {
      console.log(`Processing ${job.data.type}`);
      return { processed: true };
    });
  }
  async getStats() {
    return {
      active: await this.queue.getActiveCount(),
      waiting: await this.queue.getWaitingCount(),
      failed: await this.queue.getFailedCount()
    };
  }
}
module.exports = QueueController;