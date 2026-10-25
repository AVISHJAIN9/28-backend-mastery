/**
 * Event-Driven Architecture Routes
 */

const express = require('express');
const controller = require('./controller');

const router = express.Router();

router.post('/publish', controller.publishEvent);           // Publish an event
router.post('/subscribe', controller.subscribeEvent);       // Subscribe to event
router.get('/events', controller.getEvents);                // Get all events
router.get('/log', controller.getEventLog);                 // Get event log
router.get('/subscribers', controller.getSubscribers);      // Get subscribers
router.get('/dashboard', controller.getDashboard);          // Dashboard view
router.get('/patterns', controller.getPatterns);            // Architecture patterns

module.exports = router;

