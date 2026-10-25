/**
 * Controller - Unit Testing Examples
 * Contains functions that are meant to be tested
 */

const { validateUserCreation, validateCalculate } = require('./schema');

// ==================== Math Functions ====================

/**
 * @description Add two numbers
 * @param {number} a - First number
 * @param {number} b - Second number
 * @returns {number} Sum of a and b
 */
const add = (a, b) => {
  if (typeof a !== 'number' || typeof b !== 'number') {
    throw new Error('Both arguments must be numbers');
  }
  return a + b;
};

/**
 * @description Subtract two numbers
 */
const subtract = (a, b) => {
  if (typeof a !== 'number' || typeof b !== 'number') {
    throw new Error('Both arguments must be numbers');
  }
  return a - b;
};

/**
 * @description Multiply two numbers
 */
const multiply = (a, b) => {
  if (typeof a !== 'number' || typeof b !== 'number') {
    throw new Error('Both arguments must be numbers');
  }
  return a * b;
};

/**
 * @description Divide two numbers
 */
const divide = (a, b) => {
  if (typeof a !== 'number' || typeof b !== 'number') {
    throw new Error('Both arguments must be numbers');
  }
  if (b === 0) {
    throw new Error('Division by zero');
  }
  return a / b;
};

/**
 * @description Calculate based on operation
 */
const calculate = (operation, a, b) => {
  switch (operation) {
    case 'add':
      return add(a, b);
    case 'subtract':
      return subtract(a, b);
    case 'multiply':
      return multiply(a, b);
    case 'divide':
      return divide(a, b);
    default:
      throw new Error(`Unknown operation: ${operation}`);
  }
};

// ==================== Validation Functions ====================

/**
 * @description Validate email format
 */
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(String(email).toLowerCase());
};

/**
 * @description Validate password strength
 * Requires: min 8 chars, 1 uppercase, 1 number, 1 special char
 */
const validatePassword = (password) => {
  if (!password || password.length < 8) return false;
  if (!/[A-Z]/.test(password)) return false;
  if (!/[0-9]/.test(password)) return false;
  if (!/[!@#$%^&*]/.test(password)) return false;
  return true;
};

/**
 * @description Validate name
 */
const validateName = (name) => {
  if (!name || typeof name !== 'string') return false;
  if (name.trim().length < 2) return false;
  if (name.trim().length > 100) return false;
  return true;
};

// ==================== User Management ====================

let users = {};
let userIdCounter = 1;

/**
 * @description Create a new user
 */
const createUser = (userData) => {
  const { error, value } = validateUserCreation(userData);
  
  if (error) {
    throw new Error(`Validation failed: ${error.details[0].message}`);
  }
  
  const user = {
    id: userIdCounter++,
    ...value,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  users[user.id] = user;
  return user;
};

/**
 * @description Get user by ID
 */
const getUser = (id) => {
  const user = users[id];
  if (!user) {
    throw new Error(`User not found: ${id}`);
  }
  return user;
};

/**
 * @description Get all users
 */
const getAllUsers = () => {
  return Object.values(users);
};

/**
 * @description Update user
 */
const updateUser = (id, userData) => {
  const user = getUser(id);
  
  const { error, value } = validateUserCreation({ ...user, ...userData });
  if (error) {
    throw new Error(`Validation failed: ${error.details[0].message}`);
  }
  
  const updated = {
    ...user,
    ...value,
    id: user.id,
    createdAt: user.createdAt,
    updatedAt: new Date().toISOString()
  };
  
  users[id] = updated;
  return updated;
};

/**
 * @description Delete user
 */
const deleteUser = (id) => {
  if (!users[id]) {
    throw new Error(`User not found: ${id}`);
  }
  delete users[id];
  return { message: 'User deleted', id };
};

/**
 * @description Reset users (for testing)
 */
const resetUsers = () => {
  users = {};
  userIdCounter = 1;
};

// ==================== Array Operations ====================

/**
 * @description Filter users by age
 */
const filterUsersByAge = (minAge) => {
  if (typeof minAge !== 'number' || minAge < 0) {
    throw new Error('Age must be a non-negative number');
  }
  return Object.values(users).filter(u => u.age && u.age >= minAge);
};

/**
 * @description Get user names
 */
const getUserNames = () => {
  return Object.values(users).map(u => u.name);
};

/**
 * @description Group users by age
 */
const groupUsersByAge = () => {
  return Object.values(users).reduce((groups, user) => {
    const age = user.age || 'unknown';
    if (!groups[age]) groups[age] = [];
    groups[age].push(user);
    return groups;
  }, {});
};

// ==================== Calculation Utilities ====================

/**
 * @description Calculate discount price
 */
const calculateDiscount = (price, discountPercent) => {
  if (typeof price !== 'number' || price < 0) return 0;
  if (typeof discountPercent !== 'number' || discountPercent < 0 || discountPercent > 1) {
    return price;
  }
  return parseFloat((price * (1 - discountPercent)).toFixed(2));
};

/**
 * @description Calculate tax
 */
const calculateTax = (amount, taxRate) => {
  if (typeof amount !== 'number' || amount < 0) return 0;
  if (typeof taxRate !== 'number' || taxRate < 0) return amount;
  return parseFloat((amount * taxRate).toFixed(2));
};

/**
 * @description Calculate average
 */
const calculateAverage = (numbers) => {
  if (!Array.isArray(numbers) || numbers.length === 0) return 0;
  const sum = numbers.reduce((acc, n) => acc + n, 0);
  return parseFloat((sum / numbers.length).toFixed(2));
};

// ==================== String Operations ====================

/**
 * @description Capitalize first letter
 */
const capitalize = (str) => {
  if (typeof str !== 'string') return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * @description Reverse string
 */
const reverseString = (str) => {
  if (typeof str !== 'string') return '';
  return str.split('').reverse().join('');
};

/**
 * @description Check if string is palindrome
 */
const isPalindrome = (str) => {
  if (typeof str !== 'string') return false;
  const cleaned = str.toLowerCase().replace(/\s/g, '');
  return cleaned === reverseString(cleaned);
};

// ==================== Error Handling ====================

/**
 * @description Parse JSON safely
 */
const safeJsonParse = (jsonString) => {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    throw new Error(`Invalid JSON: ${error.message}`);
  }
};

/**
 * @description Retry a function N times
 */
const retry = async (fn, maxAttempts = 3) => {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxAttempts) throw error;
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
};

module.exports = {
  // Math functions
  add,
  subtract,
  multiply,
  divide,
  calculate,
  
  // Validation functions
  validateEmail,
  validatePassword,
  validateName,
  
  // User management
  createUser,
  getUser,
  getAllUsers,
  updateUser,
  deleteUser,
  resetUsers,
  
  // Array operations
  filterUsersByAge,
  getUserNames,
  groupUsersByAge,
  
  // Calculations
  calculateDiscount,
  calculateTax,
  calculateAverage,
  
  // String operations
  capitalize,
  reverseString,
  isPalindrome,
  
  // Error handling
  safeJsonParse,
  retry
};

