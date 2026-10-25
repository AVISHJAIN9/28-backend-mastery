const express = require('express');
const WebhookController = require('./controller');
const { validateRegisterWebhook, validateWebhookEvent } = require('./middleware');

const router = express.Router();

router.post('/', validateRegisterWebhook, (req, res) => WebhookController.registerWebhook(req, res));
router.get('/', (req, res) => WebhookController.listWebhooks(req, res));
router.get('/:id', (req, res) => WebhookController.getWebhook(req, res));
router.put('/:id', (req, res) => WebhookController.updateWebhook(req, res));
router.delete('/:id', (req, res) => WebhookController.deleteWebhook(req, res));
router.post('/event/trigger', validateWebhookEvent, (req, res) => WebhookController.triggerEvent(req, res));
router.get('/delivery/:id', (req, res) => WebhookController.getDelivery(req, res));
router.post('/delivery/:id/retry', (req, res) => WebhookController.retryDelivery(req, res));

module.exports = router;
