const { v4: uuidv4 } = require('uuid');

const bulkJobs = new Map();
const resources = new Map();

class BulkOperationsController {
  static async createBulkJob(req, res) {
    try {
      const { operation, items } = req.body;
      const jobId = uuidv4();
      
      const job = {
        id: jobId,
        operation,
        totalItems: items.length,
        processed: 0,
        failed: 0,
        status: 'processing',
        items,
        createdAt: new Date()
      };
      
      bulkJobs.set(jobId, job);
      
      // Process in background
      setTimeout(() => {
        items.forEach(item => {
          try {
            if (operation === 'create') {
              resources.set(item.id || uuidv4(), item);
            }
            job.processed++;
          } catch (err) {
            job.failed++;
          }
        });
        job.status = 'completed';
      }, 100);

      res.status(201).json({ jobId, job });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  static async getBulkJob(req, res) {
    try {
      const { jobId } = req.params;
      const job = bulkJobs.get(jobId);
      if (!job) return res.status(404).json({ error: 'Job not found' });
      res.json(job);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  static async listBulkJobs(req, res) {
    try {
      res.json({ jobs: Array.from(bulkJobs.values()) });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
}
module.exports = BulkOperationsController;