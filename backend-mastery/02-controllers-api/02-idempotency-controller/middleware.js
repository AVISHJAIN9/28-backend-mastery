// ═════════════════════════════════════════════════════════════
// IDEMPOTENCY MIDDLEWARE
// Ensures requests with same idempotency key return cached response
// ═════════════════════════════════════════════════════════════

const crypto = require('crypto');
const IdempotencyKey = require('./schema');

// Middleware to handle idempotent requests
const idempotencyMiddleware = async (req, res, next) => {
  // Only apply to mutation operations
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    return next();
  }

  // Get idempotency key from headers (required)
  const idempotencyKey = req.headers['idempotency-key'];
  if (!idempotencyKey) {
    return res.status(400).json({
      error: 'Idempotency-Key header is required',
      hint: 'Add "Idempotency-Key: <uuid>" header to your request',
    });
  }

  // Validate format (UUID recommended)
  if (!isValidIdempotencyKey(idempotencyKey)) {
    return res.status(400).json({
      error: 'Invalid Idempotency-Key format',
      hint: 'Use UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx',
    });
  }

  // Get user ID (from auth middleware)
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    // Hash the request body to detect duplicate requests with same key but diff body
    const requestHash = hashRequestBody(req.body);

    // Check if this idempotency key was already processed
    let record = await IdempotencyKey.findOne({
      idempotencyKey,
      userId,
      method: req.method,
      endpoint: req.path,
    });

    // Key exists
    if (record) {
      // Request body mismatch - potential cache poisoning attack
      if (record.requestHash !== requestHash) {
        return res.status(422).json({
          error: 'Idempotency key reused with different request body',
          hint: 'Use a new Idempotency-Key for different requests',
        });
      }

      // Still processing
      if (record.status === 'processing') {
        return res.status(409).json({
          error: 'Request with this idempotency key is still being processed',
          hint: 'Wait for original request to complete or use a new key',
        });
      }

      // Return cached response
      if (record.status === 'completed') {
        res.status(record.statusCode);
        if (record.responseHeaders) {
          Object.entries(record.responseHeaders).forEach(([key, value]) => {
            if (!['connection', 'content-length', 'content-encoding'].includes(key.toLowerCase())) {
              res.setHeader(key, value);
            }
          });
        }
        return res.json(record.responseBody);
      }

      // Request failed previously
      if (record.status === 'failed') {
        return res.status(500).json({
          error: 'Previous request with this key failed',
          detail: record.error,
        });
      }
    }

    // New request - create pending record
    record = new IdempotencyKey({
      idempotencyKey,
      userId,
      method: req.method,
      endpoint: req.path,
      requestHash,
      status: 'processing',
    });

    await record.save();
    req.idempotencyRecord = record;

    // Store original res.json and res.status to capture response
    const originalJson = res.json.bind(res);
    const originalStatus = res.status.bind(res);

    let statusCode = 200;

    // Intercept status
    res.status = function(code) {
      statusCode = code;
      return originalStatus(code);
    };

    // Intercept json response
    res.json = function(body) {
      captureResponse(req.idempotencyRecord, statusCode, body, res.getHeaders());
      return originalJson(body);
    };

    next();
  } catch (error) {
    console.error('Idempotency middleware error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Capture and store response for future identical requests
async function captureResponse(record, statusCode, body, headers) {
  try {
    record.statusCode = statusCode;
    record.responseBody = body;
    record.responseHeaders = headers;
    record.status = statusCode < 400 ? 'completed' : 'failed';
    record.error = statusCode >= 400 ? JSON.stringify(body) : null;
    await record.save();
  } catch (error) {
    console.error('Failed to save idempotency response:', error);
  }
}

// Validate idempotency key format (UUID)
function isValidIdempotencyKey(key) {
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidPattern.test(key) || key.length >= 8;
}

// Hash request body to detect mutations
function hashRequestBody(body) {
  const hash = crypto.createHash('sha256');
  hash.update(JSON.stringify(body));
  return hash.digest('hex');
}

module.exports = idempotencyMiddleware;

