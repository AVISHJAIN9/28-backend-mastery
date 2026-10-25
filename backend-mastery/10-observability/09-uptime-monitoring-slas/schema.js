// Data validation schemas for Uptime Monitoring Module

const validateIncidentSimulation = (body) => {
  const errors = [];

  if (!body.type) {
    errors.push('Missing required field: type');
  }
  if (body.type && !['api_error', 'database_error', 'service_timeout'].includes(body.type)) {
    errors.push('Invalid incident type');
  }

  if (body.durationSeconds) {
    if (typeof body.durationSeconds !== 'number') {
      errors.push('durationSeconds must be a number');
    }
    if (body.durationSeconds < 1 || body.durationSeconds > 3600) {
      errors.push('durationSeconds must be between 1 and 3600');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

const validateMetricsQuery = (query) => {
  const errors = [];

  if (query.period) {
    const period = parseInt(query.period);
    if (isNaN(period) || period < 1 || period > 8760) { // Max 1 year
      errors.push('period must be a number between 1 and 8760 (hours)');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

const validateStatusPageResponse = (status) => {
  const validStatuses = ['operational', 'degraded', 'down'];
  
  if (!validStatuses.includes(status)) {
    throw new Error(`Invalid status: ${status}. Must be one of: ${validStatuses.join(', ')}`);
  }
  
  return true;
};

const validateSLOConfiguration = (slo) => {
  const errors = [];

  if (!slo.availability || typeof slo.availability !== 'number') {
    errors.push('SLO must include availability target (0-1)');
  }
  if (slo.availability < 0 || slo.availability > 1) {
    errors.push('Availability must be between 0 and 1');
  }

  if (slo.latencyP95 && typeof slo.latencyP95 !== 'number') {
    errors.push('latencyP95 must be a number (milliseconds)');
  }

  if (slo.errorRate && (typeof slo.errorRate !== 'number' || slo.errorRate < 0 || slo.errorRate > 1)) {
    errors.push('errorRate must be between 0 and 1');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Typical SLO configurations for different service tiers
const SLO_PRESETS = {
  startup: {
    availability: 0.95,    // 95% uptime
    latencyP95: 2000,      // 95th percentile: 2 seconds
    errorRate: 0.05        // 5% errors acceptable
  },
  standard: {
    availability: 0.999,   // 99.9% uptime (8.76 hours/year downtime)
    latencyP95: 500,       // 95th percentile: 500ms
    errorRate: 0.001       // 0.1% errors
  },
  enterprise: {
    availability: 0.9999,  // 99.99% uptime (52 minutes/year downtime)
    latencyP95: 200,       // 95th percentile: 200ms
    errorRate: 0.0001      // 0.01% errors
  },
  mission_critical: {
    availability: 0.99999, // 99.999% uptime (5 minutes/year downtime)
    latencyP95: 100,       // 95th percentile: 100ms
    errorRate: 0.00001     // 0.001% errors
  }
};

// Calculate downtime budget in minutes for a given month
const calculateDowntimeBudget = (sloAvailability, daysInMonth = 30) => {
  const minutesInMonth = daysInMonth * 24 * 60;
  const allowedDowntime = minutesInMonth * (1 - sloAvailability);
  return {
    minutes: Math.round(allowedDowntime * 100) / 100,
    seconds: Math.round(allowedDowntime * 60 * 100) / 100
  };
};

// Calculate actual SLI from request data
const calculateSLI = (requests) => {
  if (!requests || requests.length === 0) {
    return {
      availability: 100,
      errorRate: 0,
      latencyP95: 0
    };
  }

  const successful = requests.filter(r => r.isSuccess).length;
  const failed = requests.length - successful;
  
  const availability = (successful / requests.length) * 100;
  const errorRate = (failed / requests.length) * 100;
  
  const durations = requests.map(r => r.duration).sort((a, b) => a - b);
  const p95Index = Math.ceil((95 / 100) * durations.length) - 1;
  const latencyP95 = durations[p95Index] || 0;

  return {
    availability: parseFloat(availability.toFixed(2)),
    errorRate: parseFloat(errorRate.toFixed(2)),
    latencyP95: Math.round(latencyP95)
  };
};

// Check if SLI meets SLO
const checkSLACompliance = (sli, slo) => {
  const compliant = {
    availability: sli.availability >= (slo.availability * 100),
    latency: sli.latencyP95 <= slo.latencyP95,
    errorRate: sli.errorRate <= (slo.errorRate * 100)
  };

  return {
    compliant: compliant.availability && compliant.latency && compliant.errorRate,
    details: compliant
  };
};

const SLA_TEMPLATES = {
  standard_monthly: {
    name: 'Standard Monthly SLA',
    billingCycle: 'monthly',
    targets: {
      availability: '99.9%'
    },
    credits: {
      '99.5-99.9': '10%',
      '99.0-99.5': '25%',
      'below 99.0': '50%'
    }
  },
  enterprise_monthly: {
    name: 'Enterprise Monthly SLA',
    billingCycle: 'monthly',
    targets: {
      availability: '99.99%'
    },
    credits: {
      '99.9-99.99': '10%',
      '99.5-99.9': '25%',
      'below 99.5': '100%'
    }
  }
};

module.exports = {
  validateIncidentSimulation,
  validateMetricsQuery,
  validateStatusPageResponse,
  validateSLOConfiguration,
  calculateDowntimeBudget,
  calculateSLI,
  checkSLACompliance,
  SLO_PRESETS,
  SLA_TEMPLATES
};

