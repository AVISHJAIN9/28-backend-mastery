/**
 * Module 06: Routes - E2E user workflows
 */

const express = require('express');
const controller = require('./controller');
const router = express.Router();

router.post('/auth/login', (req, res) => {
  try {
    const result = controller.loginUser(req.body.email, req.body.password);
    res.json(result);
  } catch (e) {
    res.status(401).json({ error: e.message });
  }
});

router.post('/auth/register', (req, res) => {
  try {
    const user = controller.registerUser(
      req.body.name,
      req.body.email,
      req.body.password
    );
    res.status(201).json(user);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.post('/auth/logout', (req, res) => {
  const result = controller.logoutUser(req.headers.authorization);
  res.json(result);
});

router.get('/profile/:id', (req, res) => {
  try {
    const profile = controller.getUserProfile(req.params.id);
    res.json(profile);
  } catch (e) {
    res.status(404).json({ error: e.message });
  }
});

router.put('/profile/:id', (req, res) => {
  try {
    const updated = controller.updateProfile(req.params.id, req.body);
    res.json(updated);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.post('/validate-form', (req, res) => {
  const errors = controller.validateForm(req.body);
  if (errors) {
    res.status(400).json(errors);
  } else {
    res.json({ valid: true });
  }
});

router.get('/search', (req, res) => {
  const query = req.query.q || '';
  const results = controller.searchUsers(query);
  res.json(results);
});

router.delete('/account/:id', (req, res) => {
  try {
    const result = controller.deleteUserAccount(req.params.id, req.body.password);
    res.json(result);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

module.exports = router;

