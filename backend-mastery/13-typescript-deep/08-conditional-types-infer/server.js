/**
 * Module 13.8: Conditional Types & Infer
 * Advanced type logic with infer pattern
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());
app.use(helmet());

const users = [
  { id: 1, name: 'Alice', email: 'alice@test.com', verified: true },
  { id: 2, name: 'Bob', email: 'bob@test.com', verified: false },
  { id: 3, name: 'Charlie', email: 'charlie@test.com', verified: true }
];

/**
 * Example 1: Extract Promise Value (Infer Pattern)
 */

async function getUserAsync(id) {
  return users.find(u => u.id === id);
}

// In TypeScript: type User = Awaited<ReturnType<typeof getUserAsync>>;

/**
 * Example 2: Extract Array Element Type
 */

const userArray = users;
// In TypeScript: type User = typeof userArray[number];

/**
 * Conditional Response Handler
 * Determines response format based on query params
 */

function selectResponseFormat(result, format) {
  if (format === 'compact') {
    // Extract only id and name
    if (Array.isArray(result)) {
      return result.map(({ id, name }) => ({ id, name }));
    }
    const { id, name } = result || {};
    return { id, name };
  }

  if (format === 'detailed') {
    // Include all fields
    return result;
  }

  if (format === 'public') {
    // Remove sensitive fields
    if (Array.isArray(result)) {
      return result.map(({ id, name, email }) => ({ id, name, email }));
    }
    const { id, name, email } = result || {};
    return { id, name, email };
  }

  return result;
}

/**
 * Conditional Response Builder
 */
function buildResponse(status, data, format = 'detailed') {
  const formatted = selectResponseFormat(data, format);

  if (status === 'success') {
    return {
      ok: true,
      type: 'success',
      data: formatted,
      timestamp: Date.now()
    };
  }

  if (status === 'error') {
    return {
      ok: false,
      type: 'error',
      error: formatted || 'Unknown error',
      timestamp: Date.now()
    };
  }

  if (status === 'loading') {
    return {
      ok: true,
      type: 'loading',
      loading: true,
      timestamp: Date.now()
    };
  }

  return { ok: false, error: 'Invalid status' };
}

/**
 * GET /api/users
 * Demonstrates conditional response formatting
 */
app.get('/api/users', (req, res) => {
  const format = req.query.format || 'detailed';
  const response = buildResponse('success', users, format);
  res.json(response);
});

/**
 * GET /api/users/:id
 */
app.get('/api/users/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const user = users.find(u => u.id === id);
  const format = req.query.format || 'detailed';

  if (!user) {
    const response = buildResponse('error', 'User not found', format);
    return res.status(404).json(response);
  }

  const response = buildResponse('success', user, format);
  res.json(response);
});

/**
 * POST /api/validate-type
 * Infer and validate type shape
 */
app.post('/api/validate-type', (req, res) => {
  const { data, expectedType } = req.body;

  let isValid = false;
  let actualType = 'unknown';

  if (expectedType === 'user') {
    // Check if data matches user shape
    isValid = data && typeof data.id === 'number' && typeof data.email === 'string';
    actualType = 'user';
  }

  if (expectedType === 'users') {
    // Check if data is array of users
    isValid = Array.isArray(data) && data.every(
      (item) => typeof item.id === 'number' && typeof item.email === 'string'
    );
    actualType = 'users';
  }

  res.json({
    ok: true,
    expected: expectedType,
    actual: actualType,
    valid: isValid,
    data: data
  });
});

/**
 * POST /api/users
 * Create user
 */
app.post('/api/users', (req, res) => {
  const { name, email } = req.body;

  if (!name || !email) {
    const response = buildResponse('error', 'Name and email required');
    return res.status(400).json(response);
  }

  const newUser = {
    id: Math.max(...users.map(u => u.id), 0) + 1,
    name,
    email,
    verified: false
  };

  users.push(newUser);
  const response = buildResponse('success', newUser);
  res.status(201).json(response);
});

/**
 * PUT /api/users/:id
 */
app.put('/api/users/:id', (req, res) => {
  const user = users.find(u => u.id === parseInt(req.params.id));

  if (!user) {
    const response = buildResponse('error', 'User not found');
    return res.status(404).json(response);
  }

  if (req.body.name) user.name = req.body.name;
  if (req.body.email) user.email = req.body.email;
  if (typeof req.body.verified === 'boolean') user.verified = req.body.verified;

  const response = buildResponse('success', user);
  res.json(response);
});

/**
 * DELETE /api/users/:id
 */
app.delete('/api/users/:id', (req, res) => {
  const index = users.findIndex(u => u.id === parseInt(req.params.id));

  if (index === -1) {
    const response = buildResponse('error', 'User not found');
    return res.status(404).json(response);
  }

  const deleted = users.splice(index, 1)[0];
  const response = buildResponse('success', deleted);
  res.json(response);
});

const PORT = process.env.HTTP_PORT || 13008;

app.listen(PORT, () => {
  console.log(`✓ Server running on http://localhost:${PORT}`);
  console.log(`✓ Conditional Types & Infer`);
  console.log(`   - Conditional response formats`);
  console.log(`   - Type inference patterns`);
  console.log(`   - Dynamic type validation`);
});
