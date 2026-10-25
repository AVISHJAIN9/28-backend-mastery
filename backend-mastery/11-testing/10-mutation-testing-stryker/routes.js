const express = require('express');
const controller = require('./controller');
const router = express.Router();

router.post('/math/add', (req, res) => res.json({ result: controller.add(req.body.a, req.body.b) }));
router.post('/math/divide', (req, res) => res.json({ result: controller.divide(req.body.a, req.body.b) }));
router.post('/grade', (req, res) => res.json({ grade: controller.getGrade(req.body.score) }));
router.post('/discount', (req, res) => res.json({ result: controller.calculateDiscount(req.body.price, req.body.discount) }));
router.post('/check/positive', (req, res) => res.json({ positive: controller.isPositive(req.body.num) }));
router.post('/check/even', (req, res) => res.json({ even: controller.isEven(req.body.num) }));
router.post('/check/range', (req, res) => res.json({ inRange: controller.isInRange(req.body.num, req.body.min, req.body.max) }));

module.exports = router;

