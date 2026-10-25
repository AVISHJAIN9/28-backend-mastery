const logger = require('winston').createLogger({
  level: 'info',
  format: require('winston').format.json(),
  transports: [new (require('winston').transports.Console)()]
});

// In-memory storage for feature flags
const flags = {};
const userAudit = [];

/**
 * VULNERABLE: Hardcoded feature flags - no control, insecure
 */
const checkFlagVulnerable = (req, res) => {
  try {
    const { flag_name } = req.body;

    // Hardcoded flags - changed only in code!
    const hardcodedFlags = {
      'new_checkout': true,              // Always on, can't turn off
      'payment_retry': false,            // Always off
      'discount_engine': Math.random() > 0.5,  // Random!
      'beta_feature': process.env.ENABLE_BETA === 'true'
    };

    const isEnabled = hardcodedFlags[flag_name] || false;

    logger.warn('VULNERABLE: Hardcoded flag check', { flag_name, isEnabled });

    return res.json({
      flag_name,
      enabled: isEnabled,
      method: 'hardcoded',
      warning: 'Feature flags hardcoded in code. Redeploy required to change.'
    });
  } catch (error) {
    logger.error('Vulnerable flag check failed', { error: error.message });
    res.status(500).json({ error: 'Flag check failed' });
  }
};

/**
 * SECURE: Database-backed feature flags with targeting rules
 */
const checkFlagSecure = (req, res) => {
  try {
    const { flag_name, user_id, context } = req.body;

    // Get flag from database
    const flag = flags[flag_name];

    if (!flag) {
      logger.warn('Flag not found', { flag_name });
      return res.status(404).json({
        flag_name,
        enabled: false,
        reason: 'Flag not found'
      });
    }

    if (!flag.enabled) {
      logger.info('Flag disabled', { flag_name });
      return res.json({
        flag_name,
        enabled: false,
        reason: 'Flag globally disabled'
      });
    }

    // Check rollout percentage (canary deployment)
    const rolloutHash = shouldRollout(user_id, flag.name, flag.rollout_percentage);

    if (!rolloutHash) {
      logger.info('User not in rollout', { flag_name, user_id });
      return res.json({
        flag_name,
        enabled: false,
        reason: `Below ${flag.rollout_percentage}% rollout threshold`
      });
    }

    // Apply targeting rules
    const targeting = evaluateTargetingRules(flag.targeting_rules || [], context);

    if (targeting.matched && targeting.action === 'disable') {
      logger.info('Targeting rule disabled flag', { flag_name, rule: targeting.rule });
      return res.json({
        flag_name,
        enabled: false,
        reason: `Targeting rule matched: ${targeting.rule}`
      });
    }

    // Select variant if applicable
    let variant = null;
    if (flag.variants && flag.variants.length > 0) {
      variant = selectVariant(user_id, flag.name, flag.variants);
    }

    logger.info('Flag enabled', { flag_name, user_id, variant: variant?.name });

    return res.json({
      flag_name,
      enabled: true,
      variant: variant,
      method: 'database',
      message: 'Feature flag enabled with targeting rules applied'
    });
  } catch (error) {
    logger.error('Secure flag check failed', { error: error.message });
    res.status(500).json({ error: 'Flag check failed' });
  }
};

/**
 * Determine if user is in rollout percentage (deterministic)
 */
const shouldRollout = (userId, flagName, percentage) => {
  if (percentage === 100) return true;
  if (percentage === 0) return false;

  // Consistent hash: same user always gets same result
  const hash = require('crypto')
    .createHash('md5')
    .update(`${userId}:${flagName}`)
    .digest('hex');

  const hashValue = parseInt(hash.substring(0, 8), 16) % 100;
  return hashValue < percentage;
};

/**
 * Evaluate targeting rules (e.g., only for enterprise users)
 */
const evaluateTargetingRules = (rules, context = {}) => {
  for (const rule of rules) {
    const contextValue = context[rule.attribute];

    let matches = false;
    switch (rule.operator) {
      case 'equals':
        matches = contextValue === rule.value;
        break;
      case 'contains':
        matches = String(contextValue).includes(rule.value);
        break;
      case 'greater_than':
        matches = contextValue > rule.value;
        break;
      case 'less_than':
        matches = contextValue < rule.value;
        break;
    }

    if (matches) {
      return {
        matched: true,
        action: rule.on_match,
        rule: `${rule.attribute} ${rule.operator} ${rule.value}`
      };
    }
  }

  return { matched: false, action: null };
};

/**
 * Consistently select variant for user (A/B testing)
 */
const selectVariant = (userId, flagName, variants) => {
  const hash = require('crypto')
    .createHash('md5')
    .update(`${userId}:${flagName}:variant`)
    .digest('hex');

  const hashValue = parseInt(hash.substring(0, 8), 16) % 100;
  let accumulated = 0;

  for (const variant of variants) {
    accumulated += variant.weight || 50; // Default 50% if not specified
    if (hashValue < accumulated) {
      return variant;
    }
  }

  return variants[0];
};

/**
 * Create new feature flag
 */
const createFlag = (req, res) => {
  try {
    const { name, description, enabled, rollout_percentage, targeting_rules, variants } = req.body;

    if (flags[name]) {
      return res.status(409).json({ error: 'Flag already exists' });
    }

    flags[name] = {
      name,
      description,
      enabled,
      rollout_percentage,
      targeting_rules,
      variants,
      created_at: new Date(),
      updated_at: new Date(),
      version: 1
    };

    logger.info('Feature flag created', { name, enabled });

    return res.status(201).json({
      success: true,
      flag: flags[name],
      message: 'Feature flag created successfully'
    });
  } catch (error) {
    logger.error('Flag creation failed', { error: error.message });
    res.status(500).json({ error: 'Failed to create flag' });
  }
};

/**
 * Update feature flag
 */
const updateFlag = (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (!flags[id]) {
      return res.status(404).json({ error: 'Flag not found' });
    }

    const flag = flags[id];
    const oldState = { ...flag };

    Object.assign(flag, updates);
    flag.updated_at = new Date();
    flag.version = (flag.version || 0) + 1;

    logger.info('Feature flag updated', {
      name: id,
      changes: updates,
      version: flag.version
    });

    return res.json({
      success: true,
      flag,
      changes: updates,
      message: 'Feature flag updated successfully'
    });
  } catch (error) {
    logger.error('Flag update failed', { error: error.message });
    res.status(500).json({ error: 'Failed to update flag' });
  }
};

/**
 * Get all flags
 */
const getAllFlags = (req, res) => {
  try {
    const { limit, offset } = req.query;

    const flagList = Object.values(flags);
    const paged = flagList.slice(offset, offset + limit);

    return res.json({
      flags: paged,
      total: flagList.length,
      limit,
      offset
    });
  } catch (error) {
    logger.error('Failed to fetch flags', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch flags' });
  }
};

/**
 * Get single flag
 */
const getFlag = (req, res) => {
  try {
    const { id } = req.params;

    const flag = flags[id];
    if (!flag) {
      return res.status(404).json({ error: 'Flag not found' });
    }

    return res.json(flag);
  } catch (error) {
    logger.error('Failed to fetch flag', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch flag' });
  }
};

/**
 * Delete flag
 */
const deleteFlag = (req, res) => {
  try {
    const { id } = req.params;

    if (!flags[id]) {
      return res.status(404).json({ error: 'Flag not found' });
    }

    const deleted = flags[id];
    delete flags[id];

    logger.info('Feature flag deleted', { name: id });

    return res.json({
      success: true,
      deleted,
      message: 'Feature flag deleted successfully'
    });
  } catch (error) {
    logger.error('Flag deletion failed', { error: error.message });
    res.status(500).json({ error: 'Failed to delete flag' });
  }
};

/**
 * Audit user flag evaluations
 */
const getAuditLog = (req, res) => {
  try {
    const { user_id, limit, offset } = req.query;

    let log = userAudit;
    if (user_id) {
      log = userAudit.filter(entry => entry.user_id === user_id);
    }

    const paged = log.slice(offset, offset + (limit || 50));

    return res.json({
      events: paged,
      total: log.length
    });
  } catch (error) {
    logger.error('Failed to fetch audit log', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch audit log' });
  }
};

/**
 * Clear all data
 */
const clearAllData = (req, res) => {
  try {
    Object.keys(flags).forEach(key => delete flags[key]);
    userAudit.length = 0;

    logger.info('All feature flag data cleared');

    return res.json({
      success: true,
      message: 'All data cleared'
    });
  } catch (error) {
    logger.error('Clear data failed', { error: error.message });
    res.status(500).json({ error: 'Failed to clear data' });
  }
};

module.exports = {
  checkFlagVulnerable,
  checkFlagSecure,
  createFlag,
  updateFlag,
  getAllFlags,
  getFlag,
  deleteFlag,
  getAuditLog,
  clearAllData,
  logger
};
