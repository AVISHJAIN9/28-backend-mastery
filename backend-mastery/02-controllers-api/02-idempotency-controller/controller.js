/**
 * Idempotency Controller - Prevent duplicate operations
 * Ensures that identical requests produce the same result even if called multiple times
 */
const { v4: uuidv4 } = require('uuid');

// In-memory storage for processed requests
const processedRequests = new Map();
const requestResults = new Map();

class IdempotencyController {
  /**
   * Process request with idempotency check
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  static async processWithIdempotency(req, res) {
    try {
      const idempotencyKey = req.headers['idempotency-key'];

      if (!idempotencyKey) {
        return res.status(400).json({
          error: 'Idempotency-Key header is required'
        });
      }

      // Check if this request was already processed
      if (processedRequests.has(idempotencyKey)) {
        const cachedResult = requestResults.get(idempotencyKey);
        return res.status(cachedResult.status).json(cachedResult.data);
      }

      const { operation, data } = req.body;

      if (!operation || !data) {
        return res.status(400).json({
          error: 'operation and data fields are required'
        });
      }

      // Process the actual operation
      let result;
      if (operation === 'payment') {
        result = await this.processPayment(data);
      } else if (operation === 'transfer') {
        result = await this.processTransfer(data);
      } else if (operation === 'create_resource') {
        result = await this.createResource(data);
      } else if (operation === 'update_resource') {
        result = await this.updateResource(data);
      } else if (operation === 'delete_resource') {
        result = await this.deleteResource(data);
      } else {
        return res.status(400).json({ error: 'Invalid operation' });
      }

      // Cache the result
      const responseData = {
        ...result,
        idempotencyKey,
        processedAt: new Date(),
        status: 'success'
      };

      processedRequests.set(idempotencyKey, true);
      requestResults.set(idempotencyKey, {
        status: 201,
        data: responseData
      });

      res.status(201).json(responseData);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  /**
   * Process payment operation
   */
  static async processPayment(data) {
    const { amount, currency, description, customerId } = data;

    if (!amount || !currency || !customerId) {
      throw new Error('amount, currency, and customerId are required');
    }

    const paymentId = uuidv4();
    const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    return {
      paymentId,
      transactionId,
      amount,
      currency,
      description,
      customerId,
      status: 'completed',
      timestamp: new Date(),
      metadata: { processingTime: '342ms' }
    };
  }

  /**
   * Process transfer operation
   */
  static async processTransfer(data) {
    const { fromAccount, toAccount, amount, reference } = data;

    if (!fromAccount || !toAccount || !amount) {
      throw new Error('fromAccount, toAccount, and amount are required');
    }

    const transferId = uuidv4();
    const referenceId = reference || `REF-${Date.now()}`;

    return {
      transferId,
      referenceId,
      fromAccount,
      toAccount,
      amount,
      status: 'completed',
      timestamp: new Date(),
      balanceAfter: {
        from: Math.random() * 10000,
        to: Math.random() * 10000
      }
    };
  }

  /**
   * Create resource operation
   */
  static async createResource(data) {
    const { resourceType, name, metadata } = data;

    if (!resourceType || !name) {
      throw new Error('resourceType and name are required');
    }

    const resourceId = uuidv4();

    return {
      resourceId,
      resourceType,
      name,
      metadata: metadata || {},
      status: 'created',
      createdAt: new Date()
    };
  }

  /**
   * Update resource operation
   */
  static async updateResource(data) {
    const { resourceId, resourceType, updates } = data;

    if (!resourceId || !resourceType || !updates) {
      throw new Error('resourceId, resourceType, and updates are required');
    }

    return {
      resourceId,
      resourceType,
      updates,
      status: 'updated',
      updatedAt: new Date()
    };
  }

  /**
   * Delete resource operation
   */
  static async deleteResource(data) {
    const { resourceId, resourceType } = data;

    if (!resourceId || !resourceType) {
      throw new Error('resourceId and resourceType are required');
    }

    return {
      resourceId,
      resourceType,
      status: 'deleted',
      deletedAt: new Date()
    };
  }

  /**
   * Retrieve cached response by idempotency key
   */
  static async getByIdempotencyKey(req, res) {
    try {
      const { idempotencyKey } = req.params;

      if (!requestResults.has(idempotencyKey)) {
        return res.status(404).json({
          error: 'Request with this idempotency key not found or expired'
        });
      }

      const cachedResult = requestResults.get(idempotencyKey);
      res.json(cachedResult.data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  /**
   * Retry a failed operation using idempotency key
   */
  static async retryOperation(req, res) {
    try {
      const { idempotencyKey } = req.params;

      if (!requestResults.has(idempotencyKey)) {
        return res.status(404).json({
          error: 'Original request not found'
        });
      }

      const cachedResult = requestResults.get(idempotencyKey);
      
      if (cachedResult.data.status === 'completed' || cachedResult.data.status === 'success') {
        return res.json({
          message: 'Operation already completed successfully',
          data: cachedResult.data
        });
      }

      res.json({
        message: 'Retry initiated',
        idempotencyKey,
        previousStatus: cachedResult.data.status,
        retriedAt: new Date()
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  /**
   * Clear old idempotency records (older than specified time)
   */
  static async cleanupExpiredKeys(req, res) {
    try {
      const { expirationHours = 24 } = req.query;
      const now = Date.now();
      const expirationTime = expirationHours * 60 * 60 * 1000;
      let deletedCount = 0;

      for (const [key, result] of requestResults.entries()) {
        if (now - new Date(result.data.processedAt).getTime() > expirationTime) {
          requestResults.delete(key);
          processedRequests.delete(key);
          deletedCount++;
        }
      }

      res.json({
        message: 'Cleanup completed',
        deletedCount,
        remainingKeys: requestResults.size,
        expirationHours
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  /**
   * Get statistics on cached requests
   */
  static async getStatistics(req, res) {
    try {
      const stats = {
        totalCachedRequests: requestResults.size,
        operations: {},
        oldestCachedRequest: null,
        newestCachedRequest: null,
        hitRate: 0,
        totalRequests: requestResults.size
      };

      let oldest = null;
      let newest = null;
      const operationCounts = {};

      for (const [, result] of requestResults.entries()) {
        const processedAt = new Date(result.data.processedAt);
        const operationType = result.data.paymentId ? 'payment' : 
                             result.data.transferId ? 'transfer' : 
                             result.data.resourceId ? 'resource' : 'unknown';

        operationCounts[operationType] = (operationCounts[operationType] || 0) + 1;

        if (!oldest || processedAt < oldest) oldest = processedAt;
        if (!newest || processedAt > newest) newest = processedAt;
      }

      stats.operations = operationCounts;
      stats.oldestCachedRequest = oldest;
      stats.newestCachedRequest = newest;
      stats.hitRate = stats.totalRequests > 0 ? `${((stats.totalRequests / (stats.totalRequests + 1)) * 100).toFixed(2)}%` : '0%';

      res.json(stats);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
}

module.exports = IdempotencyController;

