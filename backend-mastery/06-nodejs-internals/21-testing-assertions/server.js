require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const assert = require('assert');

const app = express();
const HTTP_PORT = process.env.HTTP_PORT || 3021;

// ==================== Middleware ====================

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==================== Test State ====================

const testState = {
  results: [],
  passed: 0,
  failed: 0
};

// ==================== Routes ====================

// Test basic assertions
app.post('/api/tests/basic-assertions', (req, res) => {
  const { value1, value2 } = req.body;
  const results = [];
  
  try {
    // Test equality
    assert.strictEqual(value1, value2, 'Values should be strictly equal');
    results.push({ test: 'strictEqual', passed: true });
  } catch (error) {
    results.push({ test: 'strictEqual', passed: false, error: error.message });
  }
  
  res.json({ success: true, results });
});

// Test type assertions
app.post('/api/tests/type-assertions', (req, res) => {
  const { value, expectedType } = req.body;
  const results = [];
  
  try {
    const actualType = typeof value;
    assert.strictEqual(actualType, expectedType, `Expected ${expectedType}, got ${actualType}`);
    results.push({ test: 'typeof check', passed: true });
  } catch (error) {
    results.push({ test: 'typeof check', passed: false, error: error.message });
  }
  
  res.json({ success: true, results });
});

// Test deep equality
app.post('/api/tests/deep-equality', (req, res) => {
  const { obj1, obj2 } = req.body;
  const results = [];
  
  try {
    assert.deepStrictEqual(obj1, obj2);
    results.push({ test: 'deepStrictEqual', passed: true });
  } catch (error) {
    results.push({ test: 'deepStrictEqual', passed: false, error: error.message });
  }
  
  res.json({ success: true, results });
});

// Test array assertions
app.post('/api/tests/array-assertions', (req, res) => {
  const { array, value } = req.body;
  const results = [];
  
  try {
    assert(Array.isArray(array), 'Input should be an array');
    results.push({ test: 'isArray', passed: true });
    
    assert(array.includes(value), `Array should include ${value}`);
    results.push({ test: 'includes', passed: true });
  } catch (error) {
    results.push({ test: 'array test', passed: false, error: error.message });
  }
  
  res.json({ success: true, results });
});

// Test throws/doesNotThrow
app.post('/api/tests/throw-assertions', (req, res) => {
  const { shouldThrow } = req.body;
  const results = [];
  
  const functionThatThrows = () => {
    throw new Error('Expected error');
  };
  
  const functionThatDoesNotThrow = () => {
    return 'ok';
  };
  
  try {
    if (shouldThrow) {
      assert.throws(functionThatThrows);
      results.push({ test: 'throws', passed: true });
    } else {
      assert.doesNotThrow(functionThatDoesNotThrow);
      results.push({ test: 'doesNotThrow', passed: true });
    }
  } catch (error) {
    results.push({ test: 'throw test', passed: false, error: error.message });
  }
  
  res.json({ success: true, results });
});

// Test range assertions
app.post('/api/tests/range-assertions', (req, res) => {
  const { value, min, max } = req.body;
  const results = [];
  
  try {
    assert(value >= min && value <= max, `Value should be between ${min} and ${max}`);
    results.push({ test: 'rangeCheck', passed: true, value });
  } catch (error) {
    results.push({ test: 'rangeCheck', passed: false, error: error.message });
  }
  
  res.json({ success: true, results });
});

// Test conditional assertions
app.post('/api/tests/conditional-assertions', (req, res) => {
  const { condition, message } = req.body;
  const results = [];
  
  try {
    assert(condition, message || 'Condition should be true');
    results.push({ test: 'condition', passed: true });
  } catch (error) {
    results.push({ test: 'condition', passed: false, error: error.message });
  }
  
  res.json({ success: true, results });
});

// Run comprehensive test suite
app.get('/api/tests/run-suite', (req, res) => {
  const tests = [];
  
  // Test 1: Equality
  try {
    assert.strictEqual(5, 5);
    tests.push({ name: 'Equality Test', passed: true });
  } catch (e) {
    tests.push({ name: 'Equality Test', passed: false, error: e.message });
  }
  
  // Test 2: Deep equality
  try {
    assert.deepStrictEqual({ a: 1 }, { a: 1 });
    tests.push({ name: 'Deep Equality Test', passed: true });
  } catch (e) {
    tests.push({ name: 'Deep Equality Test', passed: false, error: e.message });
  }
  
  // Test 3: Array check
  try {
    assert(Array.isArray([1, 2, 3]));
    tests.push({ name: 'Array Check Test', passed: true });
  } catch (e) {
    tests.push({ name: 'Array Check Test', passed: false, error: e.message });
  }
  
  // Test 4: Throws
  try {
    assert.throws(() => { throw new Error('test'); });
    tests.push({ name: 'Throws Test', passed: true });
  } catch (e) {
    tests.push({ name: 'Throws Test', passed: false, error: e.message });
  }
  
  const passed = tests.filter(t => t.passed).length;
  const failed = tests.filter(t => !t.passed).length;
  
  res.json({
    success: true,
    tests,
    summary: { total: tests.length, passed, failed }
  });
});

// ==================== Health Check ====================

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    module: '21 Testing & Assertions',
    category: '06 Nodejs Internals',
    port: HTTP_PORT,
    timestamp: new Date().toISOString()
  });
});

// ==================== Root Endpoint ====================

app.get('/', (req, res) => {
  res.json({
    name: '21 Testing & Assertions',
    module: '06-nodejs-internals - 21',
    description: 'Assert module, testing patterns',
    version: '1.0.0',
    category: '06 Nodejs Internals',
    endpoints: {
      health: '/health',
      basicAssertions: 'POST /api/tests/basic-assertions',
      typeAssertions: 'POST /api/tests/type-assertions',
      deepEquality: 'POST /api/tests/deep-equality',
      arrayAssertions: 'POST /api/tests/array-assertions',
      throwAssertions: 'POST /api/tests/throw-assertions',
      rangeAssertions: 'POST /api/tests/range-assertions',
      conditionalAssertions: 'POST /api/tests/conditional-assertions',
      runSuite: 'GET /api/tests/run-suite'
    }
  });
});

// ==================== Server Start ====================

app.listen(HTTP_PORT, () => {
  console.log(`[21-testing-assertions] listening on http://localhost:${HTTP_PORT}`);
  console.log(`[21-testing-assertions] API base: http://localhost:${HTTP_PORT}/api`);
});

module.exports = app;
