/**
 * RabbitMQ & Kafka Routes
 */

const express = require('express');
const controller = require('./controller');

const router = express.Router();

router.post('/publish', controller.publishMessage);         // Publish message
router.get('/consume', controller.consumeMessages);         // Consume messages
router.get('/stats', controller.getBrokerStats);            // Broker statistics
router.get('/config', controller.getBrokerConfig);          // Broker configuration
router.get('/dashboard', controller.getDashboard);          // Dashboard view

module.exports = router;

