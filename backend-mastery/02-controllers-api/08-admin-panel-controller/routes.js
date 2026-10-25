const express = require('express');
const AdminPanelController = require('./controller');

const router = express.Router();

// Dashboard
router.get('/dashboard', (req, res) => AdminPanelController.getDashboard(req, res));

// Users
router.get('/users', (req, res) => AdminPanelController.listUsers(req, res));
router.post('/users', (req, res) => AdminPanelController.createUser(req, res));
router.get('/users/:userId', (req, res) => AdminPanelController.getUser(req, res));
router.patch('/users/:userId', (req, res) => AdminPanelController.updateUser(req, res));
router.delete('/users/:userId', (req, res) => AdminPanelController.deleteUser(req, res));
router.post('/users/bulk/action', (req, res) => AdminPanelController.bulkUserAction(req, res));

// System Configuration
router.get('/config', (req, res) => AdminPanelController.getConfig(req, res));
router.patch('/config', (req, res) => AdminPanelController.updateConfig(req, res));

// Audit Logs
router.get('/logs', (req, res) => AdminPanelController.getAdminLogs(req, res));

module.exports = router;
