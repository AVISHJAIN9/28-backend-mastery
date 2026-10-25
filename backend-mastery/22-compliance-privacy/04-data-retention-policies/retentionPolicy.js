/**
 * Data Retention Policy Engine
 * Defines retention rules and evaluates whether data should be purged.
 */

// Retention policies: key = data category, value = config
const RETENTION_POLICIES = {
  user_accounts: {
    retentionDays: 365 * 2, // 2 years after account closure
    action: "anonymise",
    triggerField: "closed_at", // field that starts the clock
    description: "User account data retained 2 years post-closure then anonymised",
  },
  transactions: {
    retentionDays: 365 * 7, // 7 years (financial regulation)
    action: "archive",
    triggerField: "created_at",
    description: "Transaction records kept 7 years for financial compliance",
  },
  audit_logs: {
    retentionDays: 365 * 3,
    action: "archive",
    triggerField: "created_at",
    description: "Audit logs retained 3 years",
  },
  marketing_data: {
    retentionDays: 365 * 2,
    action: "delete",
    triggerField: "collected_at",
    description: "Marketing data deleted after 2 years",
  },
  support_tickets: {
    retentionDays: 365 * 3,
    action: "anonymise",
    triggerField: "closed_at",
    description: "Support ticket content anonymised after 3 years",
  },
  application_logs: {
    retentionDays: 90,
    action: "delete",
    triggerField: "created_at",
    description: "Application logs deleted after 90 days",
  },
  session_data: {
    retentionDays: 30,
    action: "delete",
    triggerField: "created_at",
    description: "Session data deleted after 30 days",
  },
};

/**
 * Check if a record is due for retention action.
 * @param {string} category - data category key
 * @param {Date} triggerDate - the date the retention clock started
 * @returns {{ isDue: boolean, action: string, daysOverdue: number }}
 */
function checkRetentionDue(category, triggerDate) {
  const policy = RETENTION_POLICIES[category];
  if (!policy) throw new Error(`Unknown retention category: ${category}`);

  const retentionMs = policy.retentionDays * 24 * 60 * 60 * 1000;
  const expiresAt = new Date(triggerDate.getTime() + retentionMs);
  const now = new Date();
  const isDue = now >= expiresAt;
  const daysOverdue = isDue ? Math.floor((now - expiresAt) / (24 * 60 * 60 * 1000)) : 0;

  return { isDue, action: policy.action, expiresAt, daysOverdue };
}

/**
 * Get all retention policies (for dashboard/reporting).
 */
function getAllPolicies() {
  return Object.entries(RETENTION_POLICIES).map(([key, policy]) => ({
    category: key,
    ...policy,
    retentionYears: (policy.retentionDays / 365).toFixed(1),
  }));
}

/**
 * Get policy for a specific category.
 */
function getPolicy(category) {
  return RETENTION_POLICIES[category] || null;
}

module.exports = { RETENTION_POLICIES, checkRetentionDue, getAllPolicies, getPolicy };
