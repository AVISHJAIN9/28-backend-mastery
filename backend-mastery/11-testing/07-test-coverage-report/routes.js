/**
 * Module 07: Routes - Coverage testing endpoints
 */

const express = require('express');
const controller = require('./controller');
const router = express.Router();

// ============ MATH ============

router.post('/math/add', (req, res) => {
  const result = controller.add(req.body.a, req.body.b);
  res.json({ result });
});

router.post('/math/divide', (req, res) => {
  try {
    const result = controller.divide(req.body.a, req.body.b);
    res.json({ result });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// ============ VALIDATION ============

router.post('/validate/email', (req, res) => {
  const valid = controller.isValidEmail(req.body.email);
  res.json({ valid });
});

router.post('/validate/password', (req, res) => {
  const valid = controller.isValidPassword(req.body.password);
  res.json({ valid });
});

// ============ BUSINESS LOGIC ============

router.post('/discount', (req, res) => {
  const discounted = controller.calculateDiscount(req.body.price, req.body.role);
  res.json({ discounted });
});

router.post('/tax', (req, res) => {
  const total = controller.calculateTax(req.body.amount, req.body.rate);
  res.json({ total });
});

// ============ STRING OPERATIONS ============

router.post('/strings/capitalize', (req, res) => {
  const result = controller.capitalize(req.body.text);
  res.json({ result });
});

router.post('/strings/palindrome', (req, res) => {
  const isPalindrome = controller.isPalindrome(req.body.text);
  res.json({ isPalindrome });
});

// ============ ARRAY OPERATIONS ============

router.post('/arrays/sum', (req, res) => {
  const sum = controller.sum(req.body.arr || []);
  res.json({ sum });
});

router.post('/arrays/average', (req, res) => {
  const average = controller.average(req.body.arr || []);
  res.json({ average });
});

module.exports = router;

