const express = require('express');
const router = express.Router();
const { validateUserInput, validateOrderInput, validateProductInput, validateUserId } = require('./middleware');
const userController = require('./controller').userController;
const orderController = require('./controller').orderController;
const productController = require('./controller').productController;

// ==================== USER MODULE ROUTES ====================
router.get('/users', (req, res) => {
  try {
    const users = userController.getAllUsers();
    res.json({ success: true, data: users, module: 'user' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/users', validateUserInput, (req, res) => {
  try {
    const user = userController.createUser(req.body);
    res.status(201).json({ success: true, data: user, module: 'user' });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/users/:id', validateUserId, (req, res) => {
  try {
    const user = userController.getUserById(parseInt(req.params.id));
    res.json({ success: true, data: user, module: 'user' });
  } catch (error) {
    res.status(404).json({ success: false, error: error.message });
  }
});

// ==================== ORDER MODULE ROUTES ====================
router.get('/orders', (req, res) => {
  try {
    const orders = orderController.getAllOrders();
    res.json({ success: true, data: orders, module: 'order' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/orders', validateOrderInput, (req, res) => {
  try {
    const order = orderController.createOrder(req.body);
    res.status(201).json({ success: true, data: order, module: 'order' });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ==================== PRODUCT MODULE ROUTES ====================
router.get('/products', (req, res) => {
  try {
    const products = productController.getAllProducts();
    res.json({ success: true, data: products, module: 'product' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/products', validateProductInput, (req, res) => {
  try {
    const product = productController.createProduct(req.body);
    res.status(201).json({ success: true, data: product, module: 'product' });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/status', (req, res) => {
  res.json({
    status: 'operational',
    architecture: 'Modular Monolith',
    modules: ['user', 'order', 'product', 'payment'],
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
