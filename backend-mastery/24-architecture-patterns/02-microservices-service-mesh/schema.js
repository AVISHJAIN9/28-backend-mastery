// ==================== User Service Schema ====================

const validateUserSchema = (data) => {
  const errors = [];
  
  // Name validation
  if (!data.name) {
    errors.push({
      path: ['name'],
      message: 'Name is required'
    });
  } else if (typeof data.name !== 'string' || data.name.length < 2) {
    errors.push({
      path: ['name'],
      message: 'Name must be at least 2 characters'
    });
  } else if (data.name.length > 100) {
    errors.push({
      path: ['name'],
      message: 'Name must not exceed 100 characters'
    });
  }
  
  // Email validation
  if (!data.email) {
    errors.push({
      path: ['email'],
      message: 'Email is required'
    });
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push({
      path: ['email'],
      message: 'Email must be valid'
    });
  }
  
  // Role validation
  if (data.role && !['user', 'admin', 'moderator'].includes(data.role)) {
    errors.push({
      path: ['role'],
      message: 'Role must be one of: user, admin, moderator'
    });
  }
  
  // Status validation
  if (data.status && !['active', 'inactive', 'suspended'].includes(data.status)) {
    errors.push({
      path: ['status'],
      message: 'Status must be one of: active, inactive, suspended'
    });
  }
  
  return {
    error: errors.length > 0 ? { details: errors } : null,
    value: data
  };
};

// ==================== Order Service Schema ====================

const validateOrderSchema = (data) => {
  const errors = [];
  
  // User ID validation
  if (data.userId === undefined || data.userId === null) {
    errors.push({
      path: ['userId'],
      message: 'userId is required'
    });
  } else if (typeof data.userId !== 'number' || data.userId <= 0) {
    errors.push({
      path: ['userId'],
      message: 'userId must be a positive number'
    });
  }
  
  // Items validation
  if (!data.items) {
    errors.push({
      path: ['items'],
      message: 'items array is required'
    });
  } else if (!Array.isArray(data.items)) {
    errors.push({
      path: ['items'],
      message: 'items must be an array'
    });
  } else if (data.items.length === 0) {
    errors.push({
      path: ['items'],
      message: 'items array must have at least one item'
    });
  } else {
    // Validate each item
    for (let i = 0; i < data.items.length; i++) {
      if (typeof data.items[i] !== 'string' || data.items[i].length === 0) {
        errors.push({
          path: ['items', i],
          message: 'Each item must be a non-empty string'
        });
      }
    }
  }
  
  // Quantity validation (optional)
  if (data.quantity && (typeof data.quantity !== 'number' || data.quantity <= 0)) {
    errors.push({
      path: ['quantity'],
      message: 'quantity must be a positive number'
    });
  }
  
  // Delivery address validation (optional)
  if (data.deliveryAddress) {
    if (typeof data.deliveryAddress !== 'string' || data.deliveryAddress.length < 10) {
      errors.push({
        path: ['deliveryAddress'],
        message: 'Delivery address must be at least 10 characters'
      });
    }
  }
  
  return {
    error: errors.length > 0 ? { details: errors } : null,
    value: data
  };
};

// ==================== Payment Service Schema ====================

const validatePaymentSchema = (data) => {
  const errors = [];
  
  // Order ID validation
  if (data.orderId === undefined || data.orderId === null) {
    errors.push({
      path: ['orderId'],
      message: 'orderId is required'
    });
  } else if (typeof data.orderId !== 'number' || data.orderId <= 0) {
    errors.push({
      path: ['orderId'],
      message: 'orderId must be a positive number'
    });
  }
  
  // Amount validation
  if (data.amount === undefined || data.amount === null) {
    errors.push({
      path: ['amount'],
      message: 'amount is required'
    });
  } else if (typeof data.amount !== 'number' || data.amount <= 0) {
    errors.push({
      path: ['amount'],
      message: 'amount must be a positive number'
    });
  } else if (data.amount > 1000000) {
    errors.push({
      path: ['amount'],
      message: 'amount exceeds maximum allowed value'
    });
  }
  
  // Payment method validation
  const validMethods = ['credit_card', 'debit_card', 'paypal', 'bank_transfer', 'crypto'];
  if (!data.method) {
    errors.push({
      path: ['method'],
      message: 'Payment method is required'
    });
  } else if (!validMethods.includes(data.method)) {
    errors.push({
      path: ['method'],
      message: `Payment method must be one of: ${validMethods.join(', ')}`
    });
  }
  
  // Card validation (if credit/debit card)
  if (['credit_card', 'debit_card'].includes(data.method)) {
    if (!data.cardNumber) {
      errors.push({
        path: ['cardNumber'],
        message: 'Card number is required for card payments'
      });
    } else if (!/^\d{13,19}$/.test(data.cardNumber.replace(/\D/g, ''))) {
      errors.push({
        path: ['cardNumber'],
        message: 'Card number must be 13-19 digits'
      });
    }

    if (!data.expiryDate || !/^\d{2}\/\d{2}$/.test(data.expiryDate)) {
      errors.push({
        path: ['expiryDate'],
        message: 'Expiry date must be in MM/YY format'
      });
    }

    if (!data.cvv || !/^\d{3,4}$/.test(data.cvv)) {
      errors.push({
        path: ['cvv'],
        message: 'CVV must be 3-4 digits'
      });
    }
  }
  
  // Currency validation (optional)
  if (data.currency && !/^[A-Z]{3}$/.test(data.currency)) {
    errors.push({
      path: ['currency'],
      message: 'Currency must be a valid 3-letter code (e.g., USD, EUR)'
    });
  }
  
  // Idempotency key validation (optional, for preventing duplicate charges)
  if (data.idempotencyKey && typeof data.idempotencyKey !== 'string') {
    errors.push({
      path: ['idempotencyKey'],
      message: 'idempotencyKey must be a string'
    });
  }
  
  return {
    error: errors.length > 0 ? { details: errors } : null,
    value: data
  };
};

// ==================== Inventory Service Schema ====================

const validateInventorySchema = (data) => {
  const errors = [];
  
  if (!data.itemName) {
    errors.push({
      path: ['itemName'],
      message: 'itemName is required'
    });
  }
  
  if (data.quantity === undefined || typeof data.quantity !== 'number') {
    errors.push({
      path: ['quantity'],
      message: 'quantity must be a positive number'
    });
  }
  
  return {
    error: errors.length > 0 ? { details: errors } : null,
    value: data
  };
};

// ==================== Batch Request Schema ====================

const validateBatchRequestSchema = (data) => {
  const errors = [];
  
  if (!Array.isArray(data.requests)) {
    errors.push({
      path: ['requests'],
      message: 'requests must be an array'
    });
  } else if (data.requests.length === 0) {
    errors.push({
      path: ['requests'],
      message: 'requests array must have at least one request'
    });
  } else if (data.requests.length > 100) {
    errors.push({
      path: ['requests'],
      message: 'requests array cannot exceed 100 requests'
    });
  }
  
  return {
    error: errors.length > 0 ? { details: errors } : null,
    value: data
  };
};

// ==================== Exports ====================

module.exports = {
  validateUserSchema,
  validateOrderSchema,
  validatePaymentSchema,
  validateInventorySchema,
  validateBatchRequestSchema
};
