/**
 * Middleware for room management
 */

// ==================== Validation Middleware ====================

/**
 * Validate room ID in request parameters
 */
const roomAuth = (req, res, next) => {
  const { roomId } = req.params;

  if (!roomId || typeof roomId !== 'string' || roomId.trim() === '') {
    return res.status(400).json({
      error: 'Invalid room ID',
      message: 'Room ID is required and must be a non-empty string'
    });
  }

  req.roomId = roomId.trim();
  next();
};

/**
 * Validate room creation request body
 */
const validateRoomCreation = (req, res, next) => {
  const { roomId, name } = req.body;

  // Check required fields
  if (!roomId) {
    return res.status(400).json({
      error: 'Validation failed',
      message: 'Room ID is required'
    });
  }

  if (!name) {
    return res.status(400).json({
      error: 'Validation failed',
      message: 'Room name is required'
    });
  }

  // Validate types
  if (typeof roomId !== 'string' || typeof name !== 'string') {
    return res.status(400).json({
      error: 'Validation failed',
      message: 'Room ID and name must be strings'
    });
  }

  // Validate length
  if (roomId.length < 3 || roomId.length > 50) {
    return res.status(400).json({
      error: 'Validation failed',
      message: 'Room ID must be 3-50 characters'
    });
  }

  if (name.length < 1 || name.length > 100) {
    return res.status(400).json({
      error: 'Validation failed',
      message: 'Room name must be 1-100 characters'
    });
  }

  next();
};

/**
 * Validate room update request body
 */
const validateRoomUpdate = (req, res, next) => {
  const allowedFields = ['name', 'description', 'isLive', 'maxViewers'];
  const providedFields = Object.keys(req.body);

  // Check if any provided field is not allowed
  const invalidFields = providedFields.filter(
    field => !allowedFields.includes(field)
  );

  if (invalidFields.length > 0) {
    return res.status(400).json({
      error: 'Validation failed',
      message: `Invalid fields: ${invalidFields.join(', ')}`,
      allowedFields
    });
  }

  // Validate data types
  if ('name' in req.body && typeof req.body.name !== 'string') {
    return res.status(400).json({
      error: 'Validation failed',
      message: 'Room name must be a string'
    });
  }

  if ('description' in req.body && typeof req.body.description !== 'string') {
    return res.status(400).json({
      error: 'Validation failed',
      message: 'Room description must be a string'
    });
  }

  if ('isLive' in req.body && typeof req.body.isLive !== 'boolean') {
    return res.status(400).json({
      error: 'Validation failed',
      message: 'isLive must be a boolean'
    });
  }

  if ('maxViewers' in req.body) {
    const max = req.body.maxViewers;
    if (typeof max !== 'number' || max < 1 || max > 10000) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'maxViewers must be a number between 1 and 10000'
      });
    }
  }

  next();
};

// ==================== Request Logging ====================

/**
 * Log room requests
 */
const logRoomRequest = (req, res, next) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const path = req.path;
  const roomId = req.params.roomId || 'N/A';

  console.log(`[${timestamp}] ${method} ${path} - Room: ${roomId}`);

  next();
};

// ==================== Error Handling Middleware ====================

/**
 * Handle room not found errors
 */
const handleRoomNotFound = (controller) => {
  return (req, res, next) => {
    const { roomId } = req.params;

    if (!controller.getRoom(roomId)) {
      return res.status(404).json({
        error: 'Room not found',
        message: `Room with ID '${roomId}' does not exist`,
        roomId
      });
    }

    next();
  };
};

// ==================== Query Parameter Middleware ====================

/**
 * Validate and parse query parameters
 */
const parseQueryParams = (req, res, next) => {
  const { filter, search, limit, offset } = req.query;

  // Validate filter
  if (filter && !['live', 'public', 'private'].includes(filter)) {
    return res.status(400).json({
      error: 'Invalid filter',
      message: 'Filter must be one of: live, public, private',
      validFilters: ['live', 'public', 'private']
    });
  }

  // Validate pagination
  if (limit) {
    const parsedLimit = parseInt(limit);
    if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
      return res.status(400).json({
        error: 'Invalid limit',
        message: 'Limit must be a number between 1 and 100'
      });
    }
    req.query.limit = parsedLimit;
  }

  if (offset) {
    const parsedOffset = parseInt(offset);
    if (isNaN(parsedOffset) || parsedOffset < 0) {
      return res.status(400).json({
        error: 'Invalid offset',
        message: 'Offset must be a non-negative number'
      });
    }
    req.query.offset = parsedOffset;
  }

  next();
};

// ==================== Rate Limiting Middleware ====================

/**
 * Simple in-memory rate limiter for room creation
 */
const roomCreationLimiter = (() => {
  const attempts = new Map();
  const WINDOW = 60000; // 1 minute
  const MAX_ATTEMPTS = 10;

  return (req, res, next) => {
    const ip = req.ip;
    const now = Date.now();

    if (!attempts.has(ip)) {
      attempts.set(ip, []);
    }

    // Clean old attempts
    const ipAttempts = attempts.get(ip).filter(time => now - time < WINDOW);
    attempts.set(ip, ipAttempts);

    if (ipAttempts.length >= MAX_ATTEMPTS) {
      return res.status(429).json({
        error: 'Too many requests',
        message: 'Rate limit exceeded. Try again later.',
        retryAfter: WINDOW / 1000
      });
    }

    ipAttempts.push(now);
    next();
  };
})();

// ==================== Response Formatting Middleware ====================

/**
 * Wrap successful responses
 */
const successResponse = (req, res, next) => {
  const originalJson = res.json.bind(res);

  res.json = function(data) {
    if (!data.success && !data.error) {
      data.success = true;
    }
    return originalJson(data);
  };

  next();
};

/**
 * Add CORS headers
 */
const corsHeaders = (req, res, next) => {
  res.header('Access-Control-Allow-Credentials', true);
  next();
};

module.exports = {
  roomAuth,
  validateRoomCreation,
  validateRoomUpdate,
  logRoomRequest,
  handleRoomNotFound,
  parseQueryParams,
  roomCreationLimiter,
  successResponse,
  corsHeaders
};