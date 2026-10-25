// ═════════════════════════════════════════════════════════════
// IDEMPOTENCY KEY SCHEMA
// Stores idempotent request records to prevent duplicate processing
// ═════════════════════════════════════════════════════════════

const mongoose = require('mongoose');

const idempotencyKeySchema = new mongoose.Schema(
  {
    idempotencyKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    method: {
      type: String,
      enum: ['POST', 'PUT', 'PATCH', 'DELETE'],
      required: true,
    },
    endpoint: {
      type: String,
      required: true,
    },
    requestHash: {
      type: String,
      required: true,
    },
    // Response cache
    statusCode: Number,
    responseBody: mongoose.Schema.Types.Mixed,
    responseHeaders: mongoose.Schema.Types.Mixed,
    
    // Processing status
    status: {
      type: String,
      enum: ['processing', 'completed', 'failed'],
      default: 'processing',
      index: true,
    },
    error: String,
    
    // TTL - expires after 24 hours
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000),
      index: { expireAfterSeconds: 0 },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('IdempotencyKey', idempotencyKeySchema);

