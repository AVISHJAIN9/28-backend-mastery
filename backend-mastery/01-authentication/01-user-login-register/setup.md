# Module 01-01: Setup & Testing Guide

## Prerequisites

- Node.js 16+
- npm or yarn
- Postman or curl (for API testing)
- macOS/Linux/Windows

## Installation

```bash
cd 01-authentication/01-user-login-register
npm install
```

## Environment Variables

Create `.env` file from `.env.example`:

```bash
cp .env.example .env
```

**Contents:**
```
HTTP_PORT=3001
NODE_ENV=development
```

## How to run

### Start Backend Server

```bash
node server.js
```

**Expected output:**
```
Server running on port 3001
Routes registered
Ready for authentication tests
```

### Access API

- Base URL: `http://localhost:3001`
- Endpoints available: `/register`, `/login`, `/health`

## How to test

### Test 1: Healthy Server Check

**Endpoint:** `GET /health`

**Request:**
```bash
curl http://localhost:3001/health
```

**Expected Response (200):**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

### Test 2: Register New User (Success)

**Endpoint:** `POST /register`

**Request:**
```bash
curl -X POST http://localhost:3001/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@test.com",
    "password": "MySecurePassword123!",
    "name": "Alice Smith"
  }'
```

**Expected Response (201):**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "alice@test.com",
    "name": "Alice Smith"
  }
}
```

**Verification:**
- [ ] Status code is 201
- [ ] User object contains id, email, name
- [ ] Password NOT returned in response
- [ ] ID is UUID format

---

### Test 3: Register with Duplicate Email (Conflict)

**Endpoint:** `POST /register`

**Setup:** First, register a user (Test 2)

**Request:**
```bash
curl -X POST http://localhost:3001/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@test.com",
    "password": "DifferentPassword123!",
    "name": "Alice Jones"
  }'
```

**Expected Response (409):**
```json
{
  "error": "User already exists"
}
```

**Verification:**
- [ ] Status code is 409 (Conflict)
- [ ] Error message clear
- [ ] First user not affected

---

### Test 4: Register with Missing Fields (Bad Request)

**Endpoint:** `POST /register`

**Request (missing password):**
```bash
curl -X POST http://localhost:3001/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "bob@test.com",
    "name": "Bob Smith"
  }'
```

**Expected Response (400):**
```json
{
  "error": "Email, password, and name are required"
}
```

**Verification:**
- [ ] Status code is 400
- [ ] Error message clear
- [ ] User not created

---

### Test 5: Login with Correct Credentials (Success)

**Endpoint:** `POST /login`

**Setup:** First, register a user (Test 2)

**Request:**
```bash
curl -X POST http://localhost:3001/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@test.com",
    "password": "MySecurePassword123!"
  }'
```

**Expected Response (200):**
```json
{
  "message": "Login successful",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "alice@test.com",
    "name": "Alice Smith"
  }
}
```

**Verification:**
- [ ] Status code is 200
- [ ] User object returned with id, email, name
- [ ] Password NOT returned
- [ ] Same user ID as registration

---

### Test 6: Login with Wrong Password (Unauthorized)

**Endpoint:** `POST /login`

**Setup:** First, register a user (Test 2)

**Request:**
```bash
curl -X POST http://localhost:3001/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@test.com",
    "password": "WrongPassword123!"
  }'
```

**Expected Response (401):**
```json
{
  "error": "Invalid credentials"
}
```

**Verification:**
- [ ] Status code is 401 (Unauthorized)
- [ ] Error message is generic ("Invalid credentials")
- [ ] No hint about password being wrong vs email not existing
- [ ] Account not accessed

---

### Test 7: Login with Non-Existent Email (Unauthorized)

**Endpoint:** `POST /login`

**Request:**
```bash
curl -X POST http://localhost:3001/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "nonexistent@test.com",
    "password": "AnyPassword123!"
  }'
```

**Expected Response (401):**
```json
{
  "error": "Invalid credentials"
}
```

**Verification:**
- [ ] Status code is 401
- [ ] Same error message as wrong password (Test 6)
- [ ] Doesn't reveal email doesn't exist
- [ ] No account enumeration possible

---

### Test 8: Login with Missing Fields (Bad Request)

**Endpoint:** `POST /login`

**Request (missing password):**
```bash
curl -X POST http://localhost:3001/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@test.com"
  }'
```

**Expected Response (400):**
```json
{
  "error": "Email and password are required"
}
```

**Verification:**
- [ ] Status code is 400
- [ ] Clear error message
- [ ] Request rejected before password processing

---

## Automated Testing Script

Create `test.js`:

```javascript
const http = require('http');

const API_BASE = 'http://localhost:3001';
let testsPassed = 0;
let testsFailed = 0;

async function makeRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_BASE + path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          body: JSON.parse(data || '{}')
        });
      });
    });

    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function test(name, method, path, body, expectedStatus) {
  try {
    const response = await makeRequest(method, path, body);
    if (response.status === expectedStatus) {
      console.log(`✓ ${name}`);
      testsPassed++;
    } else {
      console.log(`✗ ${name} - Expected ${expectedStatus}, got ${response.status}`);
      testsFailed++;
    }
  } catch (error) {
    console.log(`✗ ${name} - ${error.message}`);
    testsFailed++;
  }
}

async function runTests() {
  console.log('Running authentication tests...\n');

  // Test 1: Health check
  await test('Health check', 'GET', '/health', null, 200);

  // Test 2: Register success
  await test('Register new user', 'POST', '/register', {
    email: `test${Date.now()}@test.com`,
    password: 'MyPassword123!',
    name: 'Test User'
  }, 201);

  // Test 3: Register duplicate
  const email = 'duplicate@test.com';
  await test('Register first user', 'POST', '/register', {
    email,
    password: 'MyPassword123!',
    name: 'User 1'
  }, 201);
  await test('Register duplicate email', 'POST', '/register', {
    email,
    password: 'DifferentPassword123!',
    name: 'User 2'
  }, 409);

  // Test 4: Login success
  const loginEmail = `login${Date.now()}@test.com`;
  const loginPassword = 'MyPassword123!';
  await test('Register for login test', 'POST', '/register', {
    email: loginEmail,
    password: loginPassword,
    name: 'Login Test User'
  }, 201);
  await test('Login success', 'POST', '/login', {
    email: loginEmail,
    password: loginPassword
  }, 200);

  // Test 5: Login wrong password
  await test('Login wrong password', 'POST', '/login', {
    email: loginEmail,
    password: 'WrongPassword123!'
  }, 401);

  // Test 6: Login non-existent email
  await test('Login non-existent email', 'POST', '/login', {
    email: 'doesnotexist@test.com',
    password: 'AnyPassword123!'
  }, 401);

  // Test 7: Missing fields
  await test('Register missing password', 'POST', '/register', {
    email: 'test@test.com',
    name: 'Test User'
  }, 400);

  await test('Login missing password', 'POST', '/login', {
    email: 'test@test.com'
  }, 400);

  console.log(`\n✓ Passed: ${testsPassed}`);
  console.log(`✗ Failed: ${testsFailed}`);
  console.log(`Total: ${testsPassed + testsFailed}`);
}

runTests();
```

**Run tests:**
```bash
node test.js
```

---

## Security Verification

### 1. Verify Password Hashing

Check that passwords are hashed:

```javascript
// Open Node.js console
node

// Simulate password hashing
const bcrypt = require('bcryptjs');
const password1 = 'MyPassword123!';
const password2 = 'MyPassword123!';

// Hash same password twice
const hash1 = await bcrypt.hash(password1, 10);
const hash2 = await bcrypt.hash(password2, 10);

console.log(hash1);  // Different each time!
console.log(hash2);  // Different due to salt

// But verification works
await bcrypt.compare(password1, hash1);  // true
await bcrypt.compare(password1, hash2);  // true
```

### 2. Verify No Password Leakage

Check responses don't contain password:

```javascript
// Register response should NOT include password
{
  "user": {
    "id": "...",
    "email": "...",
    "name": "..."
    // password field should NOT exist
  }
}

// Login response should NOT include password
{
  "message": "Login successful",
  "user": {
    // password field should NOT exist
  }
}
```

### 3. Verify Consistent Error Messages

Check that registration and login errors don't leak info:

```bash
# Register with existing email → "User already exists"
curl -X POST /register (duplicate) → 409

# Login with wrong password → "Invalid credentials"
curl -X POST /login (wrong password) → 401

# Login with non-existent email → "Invalid credentials"
curl -X POST /login (doesn't exist) → 401

# Both login failures return same message = Good security!
```

---

## Cleanup

Stop server:
```bash
^C (Ctrl+C)
```

User data is stored in memory, so it's cleared on restart.

---

## Common Issues

### Issue: Port 3001 already in use

**Solution:**
```bash
# Change port in .env
HTTP_PORT=3002

# Or kill existing process on 3001
lsof -i :3001
kill -9 <PID>
```

### Issue: Cannot find module 'bcryptjs'

**Solution:**
```bash
npm install
```

### Issue: Request timeout

**Solution:**
- Ensure server is running: `node server.js`
- Check port number matches (.env vs curl)
- On Windows, use `GET http://localhost:3001/health` in Postman instead of curl

