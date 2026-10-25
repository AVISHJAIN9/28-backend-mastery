const express = require('express');
const router = express.Router();
const controller = require('./controller');
const {
  validateVehicleCreation,
  validateNotificationSend,
  validateLoggerCreation
} = require('./middleware');

// ==================== Factory Info ====================

router.get('/info', (req, res) => {
  try {
    const info = controller.getFactoryInfo();
    res.json(info);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== Vehicle Factory Routes ====================

router.get('/vehicles', (req, res) => {
  try {
    const result = controller.getVehicles();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/vehicles/create', validateVehicleCreation, (req, res) => {
  try {
    const result = controller.createVehicle(req.validated);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Legacy endpoint for backward compatibility
router.post('/create-vehicle', validateVehicleCreation, (req, res) => {
  try {
    const result = controller.createVehicle(req.validated);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ==================== Notification Factory Routes ====================

router.post('/notifications/send', validateNotificationSend, (req, res) => {
  try {
    const result = controller.sendNotification(req.validated);
    res.json(result);
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Legacy endpoint for backward compatibility
router.post('/send-notification', validateNotificationSend, (req, res) => {
  try {
    const result = controller.sendNotification(req.validated);
    res.json(result);
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ==================== Logger Factory Routes ====================

router.post('/loggers/create', validateLoggerCreation, (req, res) => {
  try {
    const result = controller.createLogger(req.validated);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Legacy endpoint for backward compatibility
router.post('/create-logger', validateLoggerCreation, (req, res) => {
  try {
    const result = controller.createLogger(req.validated);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

module.exports = router;
