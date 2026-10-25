const express = require('express');
const ErrorHandlingController = require('./controller');
const { asyncHandler, errorHandlerMiddleware } = require('./middleware');

const router = express.Router();

router.get('/items', asyncHandler((req, res) => 
  ErrorHandlingController.getItems(req, res)
));

router.get('/item/:id', asyncHandler((req, res) => 
  ErrorHandlingController.getItem(req, res)
));

router.post('/create-item', asyncHandler((req, res) => 
  ErrorHandlingController.createItem(req, res)
));

router.post('/admin-only', asyncHandler((req, res) => 
  ErrorHandlingController.adminOnly(req, res)
));

router.post('/restricted-action', asyncHandler((req, res) => 
  ErrorHandlingController.restrictedAction(req, res)
));

router.post('/simulate-error', asyncHandler((req, res) => 
  ErrorHandlingController.simulateError(req, res)
));

router.post('/unhandled-error', asyncHandler((req, res) => 
  ErrorHandlingController.unhandledError(req, res)
));

router.post('/async-operation', asyncHandler((req, res) => 
  ErrorHandlingController.asyncOperation(req, res)
));

module.exports = router;
