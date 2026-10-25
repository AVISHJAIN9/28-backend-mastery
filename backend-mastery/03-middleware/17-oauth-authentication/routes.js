const express = require('express');
const AuthController = require('./controller');
const { jwtAuth } = require('./middleware');

const router = express.Router();

router.post('/login', (req, res) => AuthController.login(req, res));
router.post('/logout', (req, res) => AuthController.logout(req, res));
router.get('/profile', jwtAuth, (req, res) => AuthController.profile(req, res));

module.exports = router;
