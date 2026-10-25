/**
 * Module 07: Coverage Reports - Controller
 * Functions with coverage measurement
 */

// ============ BASIC MATH ============

const add = (a, b) => a + b;
const subtract = (a, b) => a - b;
const multiply = (a, b) => a * b;

const divide = (a, b) => {
  if (b === 0) throw new Error('Cannot divide by zero');
  return a / b;
};

// ============ VALIDATION ============

const isValidEmail = (email) => {
  return email && email.includes('@') && email.includes('.');
};

const isValidPassword = (password) => {
  return password && password.length >= 8;
};

const isPositive = (n) => n > 0;
const isEven = (n) => n % 2 === 0;

// ============ BUSINESS LOGIC ============

const calculateDiscount = (price, role) => {
  if (role === 'admin') return price * 0.5;
  if (role === 'member') return price * 0.2;
  return price;
};

const calculateTax = (amount, taxRate) => {
  return amount * (1 + taxRate);
};

const getStatus = (code) => {
  if (code === 200) return 'OK';
  if (code === 404) return 'Not Found';
  if (code === 500) return 'Server Error';
  return 'Unknown';
};

// ============ CONVERSIONS ============

const fahrenheitToCelsius = (f) => (f - 32) * 5/9;
const celsiusToFahrenheit = (c) => (c * 9/5) + 32;

const metersToFeet = (m) => m * 3.28084;
const feetToMeters = (f) => f / 3.28084;

// ============ STRING OPERATIONS ============

const capitalize = (str) => {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
};

const reverse = (str) => str.split('').reverse().join('');

const isPalindrome = (str) => {
  const clean = str.toLowerCase().replace(/[^a-z0-9]/g, '');
  return clean === clean.split('').reverse().join('');
};

// ============ ARRAY OPERATIONS ============

const sum = (arr) => arr.reduce((a, b) => a + b, 0);
const average = (arr) => arr.length > 0 ? sum(arr) / arr.length : 0;
const max = (arr) => arr.length > 0 ? Math.max(...arr) : null;
const min = (arr) => arr.length > 0 ? Math.min(...arr) : null;

const findDuplicate = (arr) => {
  const seen = new Set();
  for (const item of arr) {
    if (seen.has(item)) return item;
    seen.add(item);
  }
  return null;
};

module.exports = {
  add, subtract, multiply, divide,
  isValidEmail, isValidPassword, isPositive, isEven,
  calculateDiscount, calculateTax, getStatus,
  fahrenheitToCelsius, celsiusToFahrenheit, metersToFeet, feetToMeters,
  capitalize, reverse, isPalindrome,
  sum, average, max, min, findDuplicate
};

