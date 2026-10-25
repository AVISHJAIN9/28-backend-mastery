const { validateUserSchema } = require('./schema');

// ==================== Tenant Extraction ====================

const extractTenantId = (req, res, next) => {
  // Get tenantId from subdomain, header, or URL parameter
  let tenantId = req.headers['x-tenant-id'] || 
                 req.params.tenantId || 
                 req.query.tenantId ||
                 req.subdomains[0];

  if (!tenantId) {
    return res.status(400).json({
      success: false,
      error: 'Tenant ID is required',
      details: 'Provide tenantId via header (x-tenant-id), URL param, or subdomain'
    });
  }

  req.tenantId = tenantId;
  console.log(`[Multitenancy] Processing request for tenant: ${tenantId}`);
  next();
};

// ==================== Validation Middleware ====================

const validateUserInput = (req, res, next) => {
  const { error, value } = validateUserSchema(req.body);
  
  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: error.details.map(d => ({
        field: d.path.join('.'),
        message: d.message
      }))
    });
  }

  req.body = value;
  next();
};

const validateUserId = (req, res, next) => {
  const id = req.params.id;
  if (!id || isNaN(id)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid user ID'
    });
  }
  next();
};

// ==================== Tenant Isolation ====================

const tenantIsolation = (req, res, next) => {
  if (req.params.tenantId && req.params.tenantId !== req.tenantId) {
    return res.status(403).json({
      success: false,
      error: 'Tenant ID mismatch - Access denied',
      requestedTenant: req.params.tenantId,
      authorizedTenant: req.tenantId
    });
  }
  next();
};

// ==================== Error Handler ====================

const errorHandler = (err, req, res, next) => {
  console.error(`[Multitenancy Error] Tenant ${req.tenantId}:`, err.message);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Tenant operation failed',
    tenantId: req.tenantId
  });
};

// ==================== Exports ====================

module.exports = {
  extractTenantId,
  validateUserInput,
  validateUserId,
  tenantIsolation,
  errorHandler
};

