// Tenant extraction and RLS enforcement middleware

const jwt = require('jsonwebtoken');
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

/**
 * Extract tenant from JWT token
 * Token payload should include: { id, email, tenant_id, name }
 */
const extractTenantFromToken = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      logger.warn('No token provided', { ip: req.ip });
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'test-secret');
    req.user = decoded;
    req.tenant_id = decoded.tenant_id;

    if (!req.tenant_id) {
      logger.warn('No tenant_id in token', { userId: decoded.id });
      return res.status(401).json({ error: 'Invalid token: no tenant_id' });
    }

    next();
  } catch (error) {
    logger.error('Token verification failed', { error: error.message });
    res.status(401).json({ error: 'Invalid token' });
  }
};

/**
 * Extract tenant from subdomain
 * Example: acme.localhost:3001 -> tenant = 'acme'
 * Stores tenant_id in req.tenant_id after looking up in database
 */
const extractTenantFromSubdomain = (db) => {
  return async (req, res, next) => {
    try {
      // Extract subdomain from hostname
      const hostname = req.hostname;
      const parts = hostname.split('.');
      const subdomain = parts[0];

      if (subdomain === 'localhost') {
        // For localhost, check for tenant query parameter
        const tenantId = req.query.tenant_id || req.body.tenant_id;
        if (!tenantId) {
          logger.warn('No tenant context on localhost', { hostname });
          return res.status(400).json({ error: 'tenant_id required for localhost' });
        }
        req.tenant_id = tenantId;
      } else {
        // Lookup tenant by subdomain
        const result = await db.query(
          'SELECT id FROM tenants WHERE subdomain = $1',
          [subdomain]
        );

        if (!result.rows.length) {
          logger.warn('Tenant not found for subdomain', { subdomain });
          return res.status(404).json({ error: 'Tenant not found' });
        }

        req.tenant_id = result.rows[0].id;
      }

      next();
    } catch (error) {
      logger.error('Subdomain extraction failed', { error: error.message });
      res.status(500).json({ error: 'Internal server error' });
    }
  };
};

/**
 * Set RLS context in database
 * Must be called after tenant is extracted
 * Tells PostgreSQL to enforce RLS based on this tenant_id
 */
const setRLSContext = (db) => {
  return async (req, res, next) => {
    try {
      if (!req.tenant_id) {
        logger.warn('No tenant_id for RLS context', { path: req.path });
        return res.status(400).json({ error: 'Tenant context required' });
      }

      // Set the session variable for RLS
      await db.query(
        'SET app.current_tenant_id = $1',
        [req.tenant_id]
      );

      logger.info('RLS context set', {
        tenant_id: req.tenant_id,
        user_id: req.user?.id || 'anonymous'
      });

      next();
    } catch (error) {
      logger.error('RLS context failed', { error: error.message });
      res.status(500).json({ error: 'Internal server error' });
    }
  };
};

/**
 * Validate tenant ownership
 * Ensures user belongs to the tenant they're accessing
 */
const validateTenantOwnership = (db) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.tenant_id) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      // Verify user belongs to this tenant
      const result = await db.query(
        'SELECT id FROM users WHERE id = $1 AND tenant_id = $2',
        [req.user.id, req.tenant_id]
      );

      if (!result.rows.length) {
        logger.warn('User not in tenant', {
          user_id: req.user.id,
          tenant_id: req.tenant_id,
          ip: req.ip
        });
        return res.status(403).json({ error: 'Forbidden' });
      }

      next();
    } catch (error) {
      logger.error('Ownership validation failed', { error: error.message });
      res.status(500).json({ error: 'Internal server error' });
    }
  };
};

/**
 * Check user role within tenant
 * Supports: 'admin', 'member'
 */
const requireRole = (requiredRole) => {
  return async (req, res, next) => {
    try {
      const result = await db.query(
        'SELECT role FROM users WHERE id = $1 AND tenant_id = $2',
        [req.user.id, req.tenant_id]
      );

      if (!result.rows.length) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const userRole = result.rows[0].role;

      // Simple role check (admin has all permissions)
      if (userRole === 'admin' || userRole === requiredRole) {
        next();
      } else {
        logger.warn('Insufficient permissions', {
          user_id: req.user.id,
          required_role: requiredRole,
          user_role: userRole
        });
        res.status(403).json({ error: 'Insufficient permissions' });
      }
    } catch (error) {
      logger.error('Role check failed', { error: error.message });
      res.status(500).json({ error: 'Internal server error' });
    }
  };
};

module.exports = {
  extractTenantFromToken,
  extractTenantFromSubdomain,
  setRLSContext,
  validateTenantOwnership,
  requireRole
};

