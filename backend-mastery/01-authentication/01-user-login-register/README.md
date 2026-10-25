# Module 01-01: User Login & Register

## What is this?

User authentication is the foundation of secure applications. This module implements **user registration** and **user login** with password hashing using bcrypt.

**Registration:** Create a new user account with email, password, and name.

**Login:** Authenticate existing users by verifying email and password combination.

## Why does it matter?

- **Security:** Passwords are hashed, not stored plaintext
- **Compliance:** GDPR, PCI-DSS require secure password storage
- **Trust:** Users trust you with their credentials
- **Business Logic:** Core feature for any user-based application

## How it works (step by step)

### Registration Process

1. **User submits registration form:** Email, password, name
2. **Validate input:** Check format, strength, non-empty
3. **Check if user exists:** Prevent duplicates
4. **Hash password:** bcrypt with 10 rounds of key stretching
5. **Save to database:** Store hashed password, NOT plaintext
6. **Return success:** Send user ID and email (NOT password)

**Code Flow:**
```javascript
POST /register
  ├─ Validate input
  ├─ Check if email exists → 409 Conflict
  ├─ bcrypt.hash(password, 10)
  ├─ Save user {id, email, name, hashedPassword}
  └─ Return 201 Created {id, email, name}
```

### Login Process

1. **User submits credentials:** Email and password
2. **Validate input:** Check not empty
3. **Find user by email:** Query database
4. **Compare password:** bcrypt.compare(input, stored)
5. **Return session/token:** If credentials match
6. **Deny access:** If credentials don't match

**Code Flow:**
```javascript
POST /login
  ├─ Validate input
  ├─ Find user by email → 401 if not found
  ├─ bcrypt.compare(password, hashedPassword)
  ├─ Comparison true? → 401 if false
  └─ Return 200 {id, email, name, token}
```

## Key concepts

### 1. Password Hashing

**Why hash?** Database breach doesn't expose passwords.

```javascript
// Registration
const password = 'MyPassword123!';
const hashedPassword = await bcrypt.hash(password, 10);
// $2a$10$nOUIs5kJ7naTuTVk3/tfm.SIUgzLQRtH5EqIy0iHQVLVXHB2qButa

// Login
const isValid = await bcrypt.compare(input, hashedPassword);
// Compares without ever storing or logging plaintext
```

### 2. Cost Factor (Rounds)

```javascript
// Cost = 10 → 2^10 = 1024 iterations
// Takes ~10ms on modern hardware
// Future-proof: Increase to 12-14 as computers get faster

const hash = await bcrypt.hash(password, 10);
// 10 = cost factor
```

### 3. Error Messages

**IMPORTANT:** Don't reveal if email exists or password is wrong.

```javascript
// ✗ BAD - Information disclosure
if (!user) return 'Email not registered';
if (password !== stored) return 'Wrong password';

// ✓ GOOD - Same message for both cases
if (!user || wrong_password) {
  return 'Invalid credentials';
}
```

### 4. Timing Attacks

Bcrypt comparison takes same time regardless of password correctness.

```javascript
// ✓ Timing-safe (bcrypt handles it)
await bcrypt.compare(input, hash);

// ✗ Not timing-safe (simple string comparison)
if (password === stored) { ... }
// Matches faster if first char is correct → info leakage
```

## Common mistakes

### 1. Logging Passwords

```javascript
// ✗ WRONG
console.log('Login:', { email, password });
logger.info('User registered', { email, password });

// ✓ CORRECT
logger.info('Login attempt', { email, ip: req.ip });
```

### 2. Storing Plaintext

```javascript
// ✗ WRONG
db.save({ email, password: req.body.password });

// ✓ CORRECT
const hash = await bcrypt.hash(req.body.password, 10);
db.save({ email, password: hash });
```

### 3. Returning Password in Response

```javascript
// ✗ WRONG
res.json({ user: { id, email, password: hash } });

// ✓ CORRECT
res.json({ user: { id, email, name } });
// Never return password to frontend
```

### 4. Weak Password Requirements

```javascript
// ✗ WRONG
{ minLength: 6 }  // Too short (easily guessable)

// ✓ CORRECT
{
  minLength: 12,
  requireUppercase: true,
  requireNumbers: true,
  requireSymbols: true
}
```

## Real world usage

### Example 1: Email Verification

After registration, send verification email:

```javascript
POST /register → 201 Created
Send email: "Click link to verify"
User clicks link (contains token)
Verify token → Mark email as verified
User can now login
```

### Example 2: Password Reset

User forgot password flow:

```javascript
POST /forgot-password {email}
  → Generate reset token (expires in 1 hour)
  → Send email with reset link
User clicks link
  → Generates new password or shows form
User enters new password
  → bcrypt.hash (new password)
  → Update database
  → Invalidate reset token
User can login with new password
```

### Example 3: Login with 2FA

Multi-factor authentication for security:

```javascript
POST /login {email, password}
  → Verify password
  → Send 2FA code (SMS/email/authenticator)
  → Return temporary session
POST /verify-2fa {code, temp_session}
  → Verify code
  → Create full session token
  → User can access account
```

## API Endpoints

### POST /register

**Request:**
```json
{
  "email": "alice@test.com",
  "password": "MySecurePassword123!",
  "name": "Alice Smith"
}
```

**Response (201):**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "uuid-here",
    "email": "alice@test.com",
    "name": "Alice Smith"
  }
}
```

**Response (409 - User exists):**
```json
{
  "error": "User already exists"
}
```

**Response (400 - Invalid input):**
```json
{
  "error": "Invalid input"
}
```

### POST /login

**Request:**
```json
{
  "email": "alice@test.com",
  "password": "MySecurePassword123!"
}
```

**Response (200):**
```json
{
  "message": "Login successful",
  "user": {
    "id": "uuid-here",
    "email": "alice@test.com",
    "name": "Alice Smith"
  }
}
```

**Response (401 - Invalid credentials):**
```json
{
  "error": "Invalid credentials"
}
```

## Testing Checklist

- [ ] Register new user with valid credentials
- [ ] Register fails with existing email (409)
- [ ] Register fails with weak password (400)
- [ ] Login succeeds with correct credentials
- [ ] Login fails with wrong password (401)
- [ ] Login fails with non-existent email (401)
- [ ] Password not returned in responses
- [ ] Password hashed before database storage

