const express = require('express');
const controller = require('./controller');
const middleware = require('./middleware');
const router = express.Router();

// List resources
router.get('/', middleware.validateQuery, controller.list);

// Get single resource
router.get('/:id', controller.get);

// Create resource
router.post('/', middleware.validateBody, controller.create);

// Update resource  
router.patch('/:id', middleware.validateBody, controller.update);
router.put('/:id', middleware.validateBody, controller.update);

// Delete resource
router.delete('/:id', controller.delete);

module.exports = router;
