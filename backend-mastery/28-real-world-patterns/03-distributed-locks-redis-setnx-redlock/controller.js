const redis = require('redis');
const Redlock = require('redlock');
const logger = require('winston').createLogger({
  level: 'info',
  format: require('winston').format.json(),
  transports: [new (require('winston').transports.Console)()]
});

// Mock Redis client (in real app, connect to actual Redis)
const redisClient = redis.createClient({ 
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379
});

// Initialize Redlock for multi-instance coordination
const redlock = new Redlock([redisClient], {
  driftFactor: 0.01,
  retryCount: 3,
  retryDelay: 200,
  retryJitter: 200,
  automaticExtensionThreshold: 500
});

// In-memory data store (for demo)
const transactions = {};
const batchPayments = {};
const resources = { inventory: 1000 };

/**
 * VULNERABLE: Process transaction without locking - race condition
 */
const processTransactionVulnerable = async (req, res) => {
  try {
    const { transaction_id, amount, description } = req.body;
    
    // Simulate race condition window
    await new Promise(r => setTimeout(r, 100));
    
    if (!transactions[transaction_id]) {
      transactions[transaction_id] = {
        id: transaction_id,
        amount,
        description,
        status: 'processing',
        created_at: new Date(),
        processed_count: 0
      };
    }

    // Vulnerable: Read-modify-write without lock
    const tx = transactions[transaction_id];
    tx.processed_count += 1;
    tx.status = tx.processed_count > 1 ? 'duplicate_detected' : 'completed';

    logger.warn('VULNERABLE: No lock on transaction', { transaction_id });
    
    return res.json({
      success: true,
      transaction: tx,
      warning: 'Race conditions possible - multiple simultaneous requests could duplicate this transaction'
    });
  } catch (error) {
    logger.error('Vulnerable transaction failed', { error: error.message });
    res.status(500).json({ error: 'Transaction failed' });
  }
};

/**
 * SECURE: Process transaction with SETNX atomic lock
 * Uses Redis SETNX for simple single-instance locking
 */
const processTransactionSecure = async (req, res) => {
  try {
    const { transaction_id, amount, description } = req.body;
    const lock_key = `tx_lock:${transaction_id}`;
    const lock_ttl = req.body.lock_ttl || 10000;

    // Attempt atomic lock acquisition with SETNX
    const lockAcquired = await new Promise((resolve) => {
      redisClient.set(lock_key, '1', 'PX', lock_ttl, 'NX', (err, reply) => {
        resolve(reply === 'OK');
      });
    });

    if (!lockAcquired) {
      logger.warn('Failed to acquire lock - transaction in progress', { transaction_id });
      return res.status(409).json({
        error: 'Transaction already processing',
        transaction_id,
        message: 'Another process is handling this transaction. Try again in a moment.',
        retry_after: 1
      });
    }

    try {
      // Critical section - protected by lock
      if (!transactions[transaction_id]) {
        transactions[transaction_id] = {
          id: transaction_id,
          amount,
          description,
          status: 'processing',
          created_at: new Date(),
          processed_count: 0
        };
      }

      const tx = transactions[transaction_id];
      
      // Simulate transaction processing
      await new Promise(r => setTimeout(r, 200));
      
      tx.processed_count += 1;
      tx.status = 'completed';
      tx.processed_at = new Date();

      logger.info('Transaction locked and processed', { transaction_id, amount });

      res.json({
        success: true,
        transaction: tx,
        lock_used: 'SETNX',
        message: 'Transaction safely processed with atomic lock'
      });
    } finally {
      // Always release lock
      redisClient.del(lock_key, (err) => {
        if (err) logger.error('Failed to release lock', { lock_key });
      });
    }
  } catch (error) {
    logger.error('Secure transaction failed', { error: error.message });
    res.status(500).json({ error: 'Transaction failed' });
  }
};

/**
 * ADVANCED: Batch payment with Redlock for multi-instance reliability
 * Redlock provides fault tolerance across multiple Redis instances
 */
const batchPaymentRedlock = async (req, res) => {
  try {
    const { job_id, payments, lock_ttl } = req.body;
    const redlock_key = `batch_payment:${job_id}`;

    let lock;
    try {
      // Redlock automatically handles retry and fault tolerance
      lock = await redlock.lock(redlock_key, lock_ttl || 15000);
      
      logger.info('Redlock acquired for batch payment', { job_id });

      // Critical section - multiple instances won't execute simultaneously
      if (!batchPayments[job_id]) {
        batchPayments[job_id] = {
          id: job_id,
          payments,
          status: 'processing',
          processed: 0,
          failed: 0,
          created_at: new Date()
        };
      }

      const batch = batchPayments[job_id];

      // Simulate processing each payment
      for (let payment of payments) {
        await new Promise(r => setTimeout(r, 50));
        batch.processed += 1;
      }

      batch.status = 'completed';
      batch.completed_at = new Date();

      res.json({
        success: true,
        batch: batch,
        lock_strategy: 'Redlock',
        message: 'Batch payment safely processed across distributed instances'
      });
    } catch (error) {
      if (error instanceof Redlock.LockError) {
        logger.warn('Failed to acquire Redlock - job in progress', { job_id });
        return res.status(409).json({
          error: 'Batch payment already processing',
          job_id,
          message: 'Another instance is processing this batch',
          retry_after: 2
        });
      }
      throw error;
    } finally {
      // Redlock automatically extends and releases
      if (lock) {
        await lock.unlock().catch(err => 
          logger.error('Redlock release failed', { job_id })
        );
      }
    }
  } catch (error) {
    logger.error('Batch payment failed', { error: error.message });
    res.status(500).json({ error: 'Batch payment failed' });
  }
};

/**
 * Resource allocation with lock extension
 * Demonstrates TTL refresh for long-running operations
 */
const allocateResourceSecure = async (req, res) => {
  try {
    const { resource_name, quantity, duration_ms } = req.body;
    const lock_key = `resource:${resource_name}`;
    const lock_value = Date.now().toString();

    // Set lock with initial TTL
    const lockAcquired = await new Promise((resolve) => {
      redisClient.set(lock_key, lock_value, 'PX', 5000, 'NX', (err, reply) => {
        resolve(reply === 'OK');
      });
    });

    if (!lockAcquired) {
      logger.warn('Resource already allocated', { resource_name });
      return res.status(409).json({
        error: 'Resource locked by another process',
        resource: resource_name
      });
    }

    try {
      // Check sufficient inventory
      if (resources.inventory < quantity) {
        logger.warn('Insufficient resource inventory', { 
          available: resources.inventory, 
          requested: quantity 
        });
        return res.status(400).json({
          error: 'Insufficient inventory',
          available: resources.inventory,
          requested: quantity
        });
      }

      // Allocate resource
      resources.inventory -= quantity;
      
      // Extended operation - refresh lock TTL periodically
      const startTime = Date.now();
      while (Date.now() - startTime < (duration_ms || 2000)) {
        await new Promise(r => setTimeout(r, 1000));
        
        // Extend lock
        redisClient.pexpire(lock_key, 5000, (err) => {
          if (err) logger.error('Failed to extend lock');
        });
      }

      logger.info('Resource allocated successfully', { 
        resource_name, 
        quantity,
        remaining: resources.inventory 
      });

      res.json({
        success: true,
        resource: resource_name,
        allocated: quantity,
        remaining: resources.inventory,
        lock_extended: true,
        operation_duration_ms: duration_ms || 2000
      });
    } finally {
      redisClient.del(lock_key, (err) => {
        if (err) logger.error('Failed to release resource lock');
      });
    }
  } catch (error) {
    logger.error('Resource allocation failed', { error: error.message });
    res.status(500).json({ error: 'Allocation failed' });
  }
};

/**
 * Get all transactions with lock information
 */
const getTransactionsVulnerable = (req, res) => {
  try {
    res.json({
      transactions,
      warning: 'No visibility into active locks - concurrent operations may conflict'
    });
  } catch (error) {
    logger.error('Failed to list transactions', { error: error.message });
    res.status(500).json({ error: 'Failed to list transactions' });
  }
};

/**
 * Get transactions and active locks
 */
const getTransactionsSecure = async (req, res) => {
  try {
    // Get all active locks
    redisClient.keys('tx_lock:*', (err, locks) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to query locks' });
      }

      res.json({
        transactions,
        active_locks: locks || [],
        active_lock_count: (locks || []).length,
        total_transactions: Object.keys(transactions).length
      });
    });
  } catch (error) {
    logger.error('Failed to list transactions', { error: error.message });
    res.status(500).json({ error: 'Failed to list transactions' });
  }
};

/**
 * Clear all data (for testing)
 */
const clearAllData = (req, res) => {
  Object.keys(transactions).forEach(key => delete transactions[key]);
  Object.keys(batchPayments).forEach(key => delete batchPayments[key]);
  resources.inventory = 1000;
  
  redisClient.flushdb((err) => {
    if (err) logger.error('Failed to flush Redis');
    
    res.json({
      success: true,
      message: 'All data cleared',
      redis_flushed: !err
    });
  });
};

module.exports = {
  processTransactionVulnerable,
  processTransactionSecure,
  batchPaymentRedlock,
  allocateResourceSecure,
  getTransactionsVulnerable,
  getTransactionsSecure,
  clearAllData,
  logger,
  redisClient,
  redlock
};

