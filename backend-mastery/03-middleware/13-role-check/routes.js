const express = require('express');
const Controller = require('./controller');
const { requireRole } = require('./middleware');

const router = express.Router();

router.get('/admin', requireRole('admin'), (req, res) => Controller.getAdminData(req, res));

module.exports = router;
