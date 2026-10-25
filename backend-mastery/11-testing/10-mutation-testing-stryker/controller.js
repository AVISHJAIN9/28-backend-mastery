/**
 * Module 10: Mutation Testing - Controller
 * Functions for mutation testing evaluation
 */

const add = (a, b) => a + b;
const subtract = (a, b) => a - b;
const multiply = (a, b) => a * b;
const divide = (a, b) => a / b;

const isEven = (n) => n % 2 === 0;
const isOdd = (n) => n % 2 !== 0;
const isPositive = (n) => n > 0;
const isNegative = (n) => n < 0;

const getGrade = (score) => {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
};

const calculateDiscount = (price, discount) => price * (1 - discount);
const calculateTax = (amount, rate) => amount * (1 + rate);

const min = (a, b) => a < b ? a : b;
const max = (a, b) => a > b ? a : b;

const isInRange = (num, min, max) => num >= min && num <= max;

module.exports = {
  add, subtract, multiply, divide,
  isEven, isOdd, isPositive, isNegative,
  getGrade, calculateDiscount, calculateTax,
  min, max, isInRange
};

