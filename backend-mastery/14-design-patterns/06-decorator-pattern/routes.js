
const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { validateInput } = require('./middleware');

router.get('/info', (req, res) => {
  try {
    const info = controller.getPatternInfo();
    res.json(info);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/items', (req, res) => {
  try {
    const result = controller.getItems();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/items', validateInput, (req, res) => {
  try {
    const result = controller.createItem(req.validated);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/items/:id', (req, res) => {
  try {
    const result = controller.getItemById(parseInt(req.params.id));
    res.json(result);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

router.put('/items/:id', validateInput, (req, res) => {
  try {
    const result = controller.updateItem(parseInt(req.params.id), req.validated);
    res.json(result);
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.delete('/items/:id', (req, res) => {
  try {
    const result = controller.deleteItem(parseInt(req.params.id));
    res.json(result);
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

module.exports = router;
