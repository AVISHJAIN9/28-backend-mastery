const express = require('express');
const CRUDController = require('./controller');

const router = express.Router();

// POST /crud - Create product
router.post('/', (req, res) => CRUDController.create(req, res));

// GET /crud - Read all products
router.get('/', (req, res) => CRUDController.readAll(req, res));

// GET /crud/:id - Read product
router.get('/:id', (req, res) => CRUDController.read(req, res));

// PATCH /crud/:id - Update product
router.patch('/:id', (req, res) => CRUDController.update(req, res));

// DELETE /crud/:id - Delete product
router.delete('/:id', (req, res) => CRUDController.delete(req, res));

// DELETE /crud/bulk - Bulk delete
router.delete('/bulk', (req, res) => CRUDController.bulkDelete(req, res));

module.exports = router;
