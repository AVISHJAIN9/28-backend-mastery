/**
 * Routes for Unit Testing Module
 * Endpoints to test unit testing concepts
 */

const express = require('express');
const router = express.Router();

const controller = require('./controller');
const { validateRequest, responseWrapper, testRateLimit } = require('./middleware');
const { validateCalculate } = require('./schema');

// Apply middleware
router.use(responseWrapper);
router.use(testRateLimit);

// ==================== Math Operations ====================

/**
 * @route POST /api/test/unit-math
 * @description Test math operations
 */
router.post('/test/unit-math', (req, res) => {
  try {
    const { operation, a, b } = req.body;
    
    if (!operation || a === undefined || b === undefined) {
      return req.sendError('Missing operation, a, or b', 400);
    }
    
    const result = controller.calculate(operation, a, b);
    
    req.sendSuccess(
      { operation, a, b, result },
      'Math operation successful'
    );
  } catch (error) {
    req.sendError(error.message, 400);
  }
});

/**
 * @route POST /api/test/validate-email
 * @description Test email validation
 */
router.post('/test/validate-email', (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return req.sendError('Email is required', 400);
    }
    
    const isValid = controller.validateEmail(email);
    
    req.sendSuccess(
      { email, isValid },
      isValid ? 'Valid email' : 'Invalid email'
    );
  } catch (error) {
    req.sendError(error.message, 400);
  }
});

/**
 * @route POST /api/test/validate-password
 * @description Test password validation
 */
router.post('/test/validate-password', (req, res) => {
  try {
    const { password } = req.body;
    
    if (!password) {
      return req.sendError('Password is required', 400);
    }
    
    const isValid = controller.validatePassword(password);
    const strength = isValid ? 'strong' : 'weak';
    
    req.sendSuccess(
      { password: '***', strength, isValid },
      `Password is ${strength}`
    );
  } catch (error) {
    req.sendError(error.message, 400);
  }
});

// ==================== User Management ====================

/**
 * @route POST /api/test/users
 * @description Create a new user
 */
router.post('/test/users', (req, res) => {
  try {
    const user = controller.createUser(req.body);
    req.sendSuccess(user, 'User created successfully', 201);
  } catch (error) {
    req.sendError(error.message, 400);
  }
});

/**
 * @route GET /api/test/users
 * @description Get all users
 */
router.get('/test/users', (req, res) => {
  try {
    const users = controller.getAllUsers();
    req.sendSuccess(
      { users, count: users.length },
      'Users retrieved'
    );
  } catch (error) {
    req.sendError(error.message, 500);
  }
});

/**
 * @route GET /api/test/users/:id
 * @description Get user by ID
 */
router.get('/test/users/:id', (req, res) => {
  try {
    const user = controller.getUser(parseInt(req.params.id));
    req.sendSuccess(user, 'User retrieved');
  } catch (error) {
    req.sendError(error.message, 404);
  }
});

/**
 * @route PUT /api/test/users/:id
 * @description Update user
 */
router.put('/test/users/:id', (req, res) => {
  try {
    const user = controller.updateUser(parseInt(req.params.id), req.body);
    req.sendSuccess(user, 'User updated');
  } catch (error) {
    req.sendError(error.message, 400);
  }
});

/**
 * @route DELETE /api/test/users/:id
 * @description Delete user
 */
router.delete('/test/users/:id', (req, res) => {
  try {
    const result = controller.deleteUser(parseInt(req.params.id));
    req.sendSuccess(result, 'User deleted');
  } catch (error) {
    req.sendError(error.message, 404);
  }
});

// ==================== Array Operations ====================

/**
 * @route GET /api/test/users/filter/by-age/:minAge
 * @description Filter users by minimum age
 */
router.get('/test/users/filter/by-age/:minAge', (req, res) => {
  try {
    const minAge = parseInt(req.params.minAge);
    const users = controller.filterUsersByAge(minAge);
    req.sendSuccess(
      { users, count: users.length, minAge },
      'Users filtered by age'
    );
  } catch (error) {
    req.sendError(error.message, 400);
  }
});

/**
 * @route GET /api/test/users/names
 * @description Get all user names
 */
router.get('/test/users/names', (req, res) => {
  try {
    const names = controller.getUserNames();
    req.sendSuccess(
      { names, count: names.length },
      'User names retrieved'
    );
  } catch (error) {
    req.sendError(error.message, 500);
  }
});

/**
 * @route GET /api/test/users/groups/by-age
 * @description Group users by age
 */
router.get('/test/users/groups/by-age', (req, res) => {
  try {
    const groups = controller.groupUsersByAge();
    req.sendSuccess(groups, 'Users grouped by age');
  } catch (error) {
    req.sendError(error.message, 500);
  }
});

// ==================== Calculations ====================

/**
 * @route POST /api/test/calculate/discount
 * @description Calculate discount
 */
router.post('/test/calculate/discount', (req, res) => {
  try {
    const { price, discountPercent } = req.body;
    
    if (price === undefined || discountPercent === undefined) {
      return req.sendError('Price and discountPercent are required', 400);
    }
    
    const finalPrice = controller.calculateDiscount(price, discountPercent);
    const savings = (price - finalPrice).toFixed(2);
    
    req.sendSuccess(
      { price, discountPercent, finalPrice, savings },
      'Discount calculated'
    );
  } catch (error) {
    req.sendError(error.message, 400);
  }
});

/**
 * @route POST /api/test/calculate/tax
 * @description Calculate tax
 */
router.post('/test/calculate/tax', (req, res) => {
  try {
    const { amount, taxRate } = req.body;
    
    if (amount === undefined || taxRate === undefined) {
      return req.sendError('Amount and taxRate are required', 400);
    }
    
    const tax = controller.calculateTax(amount, taxRate);
    const total = parseFloat((amount + tax).toFixed(2));
    
    req.sendSuccess(
      { amount, taxRate, tax, total },
      'Tax calculated'
    );
  } catch (error) {
    req.sendError(error.message, 400);
  }
});

/**
 * @route POST /api/test/calculate/average
 * @description Calculate average
 */
router.post('/test/calculate/average', (req, res) => {
  try {
    const { numbers } = req.body;
    
    if (!Array.isArray(numbers) || numbers.length === 0) {
      return req.sendError('Numbers array is required and must not be empty', 400);
    }
    
    const average = controller.calculateAverage(numbers);
    
    req.sendSuccess(
      { numbers, average, count: numbers.length },
      'Average calculated'
    );
  } catch (error) {
    req.sendError(error.message, 400);
  }
});

// ==================== String Operations ====================

/**
 * @route POST /api/test/string/capitalize
 * @description Capitalize string
 */
router.post('/test/string/capitalize', (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return req.sendError('Text is required', 400);
    }
    
    const result = controller.capitalize(text);
    req.sendSuccess({ input: text, output: result }, 'String capitalized');
  } catch (error) {
    req.sendError(error.message, 400);
  }
});

/**
 * @route POST /api/test/string/reverse
 * @description Reverse string
 */
router.post('/test/string/reverse', (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return req.sendError('Text is required', 400);
    }
    
    const result = controller.reverseString(text);
    req.sendSuccess({ input: text, output: result }, 'String reversed');
  } catch (error) {
    req.sendError(error.message, 400);
  }
});

/**
 * @route POST /api/test/string/palindrome
 * @description Check if string is palindrome
 */
router.post('/test/string/palindrome', (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return req.sendError('Text is required', 400);
    }
    
    const isPalindrome = controller.isPalindrome(text);
    req.sendSuccess(
      { input: text, isPalindrome },
      isPalindrome ? 'String is a palindrome' : 'String is not a palindrome'
    );
  } catch (error) {
    req.sendError(error.message, 400);
  }
});

// ==================== Testing Utilities ====================

/**
 * @route POST /api/test/reset
 * @description Reset all test data
 */
router.post('/test/reset', (req, res) => {
  try {
    controller.resetUsers();
    req.sendSuccess({ message: 'All test data reset' }, 'Reset successful');
  } catch (error) {
    req.sendError(error.message, 500);
  }
});

/**
 * @route GET /api/test/info
 * @description Get testing module info
 */
router.get('/test/info', (req, res) => {
  req.sendSuccess(
    {
      module: '01 Unit Tests Jest Vitest',
      description: 'Testing strategies & frameworks',
      endpoints: [
        'POST /api/test/unit-math',
        'POST /api/test/validate-email',
        'POST /api/test/validate-password',
        'POST /api/test/users',
        'GET /api/test/users',
        'GET /api/test/users/:id',
        'PUT /api/test/users/:id',
        'DELETE /api/test/users/:id',
        'GET /api/test/users/filter/by-age/:minAge',
        'GET /api/test/users/names',
        'GET /api/test/users/groups/by-age',
        'POST /api/test/calculate/discount',
        'POST /api/test/calculate/tax',
        'POST /api/test/calculate/average',
        'POST /api/test/string/capitalize',
        'POST /api/test/string/reverse',
        'POST /api/test/string/palindrome',
        'POST /api/test/reset'
      ]
    },
    'Module info'
  );
});

module.exports = router;

