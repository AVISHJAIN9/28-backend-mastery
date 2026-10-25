const express = require('express');
const JWTVerifyController = require('./controller');
const { jwtVerifyMiddleware, requireAuth } = require('./middleware');

const router = express.Router();

router.use(jwtVerifyMiddleware);

router.post('/generate', (req, res) => JWTVerifyController.generateJWT(req, res));
router.post('/refresh', (req, res) => JWTVerifyController.refreshJWT(req, res));
router.post('/verify', (req, res) => JWTVerifyController.verifyJWT(req, res));
router.get('/protected', requireAuth, (req, res) => res.json({ message: 'Protected route', user: req.user }));

module.exports = router;
