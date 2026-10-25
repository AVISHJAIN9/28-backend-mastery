const express = require('express');
const router = express.Router();

// ==================== Microservices Architecture ====================
// This demonstrates multiple independent services that can be deployed separately
// Service 1: User Service (6502)
// Service 2: Order Service (6503)
// Service 3: Payment Service (6504)
// This file runs in the API Gateway or User Service

const { 
  getAllUsers, 
  getUserById, 
  createUser, 
  updateUser, 
  deleteUser,
  getOrders,
  createOrder,
  processPayment
} = require('./controller');

const { 
  validateUserInput, 
  validateOrderInput, 
  validatePaymentInput,
  validateUserId 
} = require('./middleware');

// ==================== User Service Endpoints ====================

router.get('/users', (req, res) => {
  try {
    const users = getAllUsers();
    res.json({
      success: true,
      data: users,
      count: users.length,
      service: 'user-service'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/users/:id', validateUserId, (req, res) => {
  try {
    const user = getUserById(parseInt(req.params.id));
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.json({ success: true, data: user, service: 'user-service' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/users', validateUserInput, (req, res) => {
  try {
    const newUser = createUser(req.body);
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: newUser,
      service: 'user-service'
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.put('/users/:id', validateUserId, validateUserInput, (req, res) => {
  try {
    const updated = updateUser(parseInt(req.params.id), req.body);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.json({
      success: true,
      message: 'User updated successfully',
      data: updated,
      service: 'user-service'
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.delete('/users/:id', validateUserId, (req, res) => {
  try {
    const deleted = deleteUser(parseInt(req.params.id));
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.json({
      success: true,
      message: 'User deleted successfully',
      service: 'user-service'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== Order Service Endpoints ====================

router.get('/orders', (req, res) => {
  try {
    const orders = getOrders();
    res.json({
      success: true,
      data: orders,
      count: orders.length,
      service: 'order-service'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/orders', validateOrderInput, (req, res) => {
  try {
    // Call user service to verify user exists
    const userId = req.body.userId;
    const user = getUserById(userId);
    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'User not found',
        details: 'Order requires valid user ID'
      });
    }

    const newOrder = createOrder(req.body);
    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: newOrder,
      service: 'order-service'
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ==================== Payment Service Endpoints ====================

router.post('/payments', validatePaymentInput, (req, res) => {
  try {
    // Verify payment details
    const payment = processPayment(req.body);
    
    res.status(201).json({
      success: true,
      message: 'Payment processed successfully',
      data: payment,
      service: 'payment-service'
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ==================== Service Status Endpoints ====================

router.get('/status', (req, res) => {
  res.json({
    status: 'operational',
    architecture: 'Microservices with Service Mesh',
    services: {
      'user-service': { port: 6502, status: 'up' },
      'order-service': { port: 6503, status: 'up' },
      'payment-service': { port: 6504, status: 'up' }
    },
    timestamp: new Date().toISOString()
  });
});

// ==================== Service Mesh Health Routes ====================

router.get('/health/live', (req, res) => {
  res.json({ alive: true });
});

router.get('/health/ready', (req, res) => {
  res.json({ ready: true, dependencies: { database: true, cache: true } });
});

module.exports = router;
