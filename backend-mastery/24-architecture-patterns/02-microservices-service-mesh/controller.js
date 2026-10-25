// ==================== SERVICE: User Service ====================

let users = [
  { id: 1, name: 'Alice Johnson', email: 'alice@example.com', role: 'admin', status: 'active' },
  { id: 2, name: 'Bob Smith', email: 'bob@example.com', role: 'user', status: 'active' },
  { id: 3, name: 'Charlie Brown', email: 'charlie@example.com', role: 'user', status: 'inactive' }
];

let userNextId = 4;

const getAllUsers = () => {
  return users.map(user => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status
  }));
};

const getUserById = (id) => {
  const user = users.find(u => u.id === id);
  if (!user) return null;
  
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status
  };
};

const createUser = (userData) => {
  if (!userData.name || !userData.email) {
    throw new Error('Name and email are required');
  }

  if (users.some(u => u.email === userData.email)) {
    throw new Error('Email already exists');
  }

  const newUser = {
    id: userNextId++,
    name: userData.name,
    email: userData.email,
    role: userData.role || 'user',
    status: 'active',
    createdAt: new Date()
  };

  users.push(newUser);
  return newUser;
};

const updateUser = (id, userData) => {
  const user = users.find(u => u.id === id);
  if (!user) return null;

  if (userData.email && userData.email !== user.email) {
    if (users.some(u => u.email === userData.email)) {
      throw new Error('Email already exists');
    }
  }

  if (userData.name) user.name = userData.name;
  if (userData.email) user.email = userData.email;
  if (userData.status) user.status = userData.status;
  if (userData.role) user.role = userData.role;

  user.updatedAt = new Date();
  return user;
};

const deleteUser = (id) => {
  const index = users.findIndex(u => u.id === id);
  if (index === -1) return false;
  users.splice(index, 1);
  return true;
};

// ==================== SERVICE: Order Service ====================

let orders = [
  { 
    id: 1, 
    userId: 1, 
    items: ['Product A', 'Product B'], 
    total: 150.00, 
    status: 'delivered',
    createdAt: new Date(Date.now() - 86400000)
  },
  { 
    id: 2, 
    userId: 2, 
    items: ['Product C'], 
    total: 75.50, 
    status: 'processing',
    createdAt: new Date(Date.now() - 3600000)
  }
];

let orderNextId = 3;

const getOrders = () => {
  return orders.map(order => ({
    id: order.id,
    userId: order.userId,
    items: order.items,
    total: order.total,
    status: order.status,
    createdAt: order.createdAt
  }));
};

const createOrder = (orderData) => {
  if (!orderData.userId || !orderData.items || !Array.isArray(orderData.items)) {
    throw new Error('Order must have userId and items array');
  }

  if (orderData.items.length === 0) {
    throw new Error('Order must have at least one item');
  }

  // Calculate total (mock calculation: $25 per item)
  const total = orderData.items.length * 25.00;

  const newOrder = {
    id: orderNextId++,
    userId: orderData.userId,
    items: orderData.items,
    total: total,
    status: 'pending',
    createdAt: new Date()
  };

  orders.push(newOrder);
  return newOrder;
};

const getOrdersByUserId = (userId) => {
  return orders.filter(order => order.userId === userId);
};

// ==================== SERVICE: Payment Service ====================

let payments = [
  {
    id: 1,
    orderId: 1,
    amount: 150.00,
    status: 'completed',
    method: 'credit_card',
    lastFour: '4242',
    createdAt: new Date(Date.now() - 86400000)
  }
];

let paymentNextId = 2;

const processPayment = (paymentData) => {
  if (!paymentData.orderId || !paymentData.amount || !paymentData.method) {
    throw new Error('Payment requires orderId, amount, and method');
  }

  if (paymentData.amount <= 0) {
    throw new Error('Payment amount must be greater than zero');
  }

  // Simulate payment processing
  const paymentMethods = ['credit_card', 'debit_card', 'paypal', 'bank_transfer'];
  if (!paymentMethods.includes(paymentData.method)) {
    throw new Error(`Payment method must be one of: ${paymentMethods.join(', ')}`);
  }

  // Simulate occasional payment failures (10% failure rate)
  if (Math.random() < 0.1) {
    throw new Error('Payment processing failed. Please try again.');
  }

  const newPayment = {
    id: paymentNextId++,
    orderId: paymentData.orderId,
    amount: paymentData.amount,
    status: 'completed',
    method: paymentData.method,
    lastFour: paymentData.lastFour || '****',
    transactionId: `TXN-${Date.now()}`,
    createdAt: new Date()
  };

  payments.push(newPayment);
  
  // Update order status to confirmed
  const order = orders.find(o => o.id === paymentData.orderId);
  if (order) {
    order.status = 'confirmed';
  }

  return newPayment;
};

const getPaymentByOrderId = (orderId) => {
  return payments.find(p => p.orderId === orderId);
};

// ==================== SERVICE: Inventory Service ====================

let inventory = [
  { id: 1, name: 'Product A', quantity: 100, reserved: 10 },
  { id: 2, name: 'Product B', quantity: 50, reserved: 5 },
  { id: 3, name: 'Product C', quantity: 200, reserved: 20 }
];

const reserveInventory = (items) => {
  // Check if all items available
  for (const item of items) {
    const invItem = inventory.find(i => i.name === item);
    if (!invItem) {
      throw new Error(`Item not found: ${item}`);
    }
    if (invItem.quantity - invItem.reserved < 1) {
      throw new Error(`Insufficient inventory for: ${item}`);
    }
  }

  // Reserve items
  for (const item of items) {
    const invItem = inventory.find(i => i.name === item);
    invItem.reserved += 1;
  }

  return { reservedItems: items, timestamp: new Date() };
};

const releaseInventory = (items) => {
  for (const item of items) {
    const invItem = inventory.find(i => i.name === item);
    if (invItem && invItem.reserved > 0) {
      invItem.reserved -= 1;
    }
  }
  return { releasedItems: items };
};

// ==================== SERVICE: Monitoring/Observability ====================

const serviceMetrics = {
  requests: {
    total: 0,
    byService: {
      'user-service': 0,
      'order-service': 0,
      'payment-service': 0,
      'inventory-service': 0
    },
    byMethod: {
      GET: 0,
      POST: 0,
      PUT: 0,
      DELETE: 0
    }
  },
  latencies: [],
  errors: {
    total: 0,
    by4xx: 0,
    by5xx: 0
  }
};

const recordMetric = (service, method, latency, statusCode) => {
  serviceMetrics.requests.total++;
  serviceMetrics.requests.byService[service] = (serviceMetrics.requests.byService[service] || 0) + 1;
  serviceMetrics.requests.byMethod[method] = (serviceMetrics.requests.byMethod[method] || 0) + 1;
  serviceMetrics.latencies.push(latency);
  
  if (statusCode >= 400 && statusCode < 500) {
    serviceMetrics.errors.by4xx++;
  } else if (statusCode >= 500) {
    serviceMetrics.errors.by5xx++;
  }
};

const getServiceMetrics = () => {
  const metrics = { ...serviceMetrics };
  metrics.averageLatency = metrics.latencies.length > 0
    ? (metrics.latencies.reduce((a, b) => a + b, 0) / metrics.latencies.length).toFixed(2)
    : 0;
  metrics.p99Latency = metrics.latencies.length > 0
    ? metrics.latencies.sort((a, b) => a - b)[Math.floor(metrics.latencies.length * 0.99)] || 0
    : 0;
  return metrics;
};

// ==================== Exports ====================

module.exports = {
  // User Service
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,

  // Order Service
  getOrders,
  createOrder,
  getOrdersByUserId,

  // Payment Service
  processPayment,
  getPaymentByOrderId,

  // Inventory Service
  reserveInventory,
  releaseInventory,

  // Monitoring
  recordMetric,
  getServiceMetrics
};
