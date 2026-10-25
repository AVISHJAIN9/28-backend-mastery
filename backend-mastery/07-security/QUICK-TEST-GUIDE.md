# 🚀 QUICK TEST GUIDE - Backend Mastery Security Modules

## Module 02 (BOLA/IDOR) - Ready to Test Now ✅

### Start the Server
```bash
cd 02-bola-idor-object-level-auth
npm install
npm start
```

**Output:** `Server running on port 4002`

---

## Attack Scenarios - Vulnerable Endpoints

### Scenario 1: Access Admin User's Data (No Auth Required)
```bash
# User 2 is "bob" (regular user)
# User 1 is "alice" (admin) - but browser thinks it's a guest

curl http://localhost:4002/api/vulnerable/users/1

# Response (VULNERABLE - all sensitive data exposed!):
{
  "id": 1,
  "username": "alice",
  "email": "alice@example.com",
  "role": "admin",
  "salary": 150000,     ← Should never be exposed!
  "ssn": "123-45-6789", ← Should never be exposed!
  "bankAccount": "1234567890"  ← Should never be exposed!
}
```

### Scenario 2: Access Invoice of Another Customer
```bash
# Invoice 3 belongs to user ID 2
# But we're accessing it as anonymous user

curl http://localhost:4002/api/vulnerable/invoices/3

# Response (VULNERABLE - unauthorized access!):
{
  "id": 3,
  "userId": 2,
  "amount": 5000,
  "description": "Consulting Services",
  "status": "paid",
  "dueDate": "2024-04-15"
}
```

---

## Defensive Solutions - Secure Endpoints

### Step 1: Get JWT Token (Login)
```bash
curl -X POST http://localhost:4002/api/secure/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@example.com",
    "password": "password123"
  }'

# Response:
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "userId": 1,
  "role": "admin"
}

# Save the token for next requests
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Step 2: Test Ownership Check - Own Data (Allowed)
```bash
# User 1 (alice) requesting their own data
curl http://localhost:4002/api/secure/users/1 \
  -H "Authorization: Bearer $TOKEN"

# Response (SUCCESS - safe data only):
{
  "id": 1,
  "username": "alice",
  "email": "alice@example.com"
  # salary, ssn, bankAccount NOT included ✓
}
```

### Step 3: Test Authorization Check - Other's Data (Blocked)
```bash
# User 1 (alice) requesting user 2's (bob's) data
curl http://localhost:4002/api/secure/users/2 \
  -H "Authorization: Bearer $TOKEN"

# Response (403 FORBIDDEN):
{
  "error": "Forbidden"
}
```

### Step 4: Test Admin Override (Allowed with Admin Role)
```bash
# alice is admin, so can view anyone's data
# Bob is not admin - let's login as bob instead

curl -X POST http://localhost:4002/api/secure/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "bob@example.com",
    "password": "password456"
  }'

# Get bob's token
BOB_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Bob tries to access alice's data (should fail)
curl http://localhost:4002/api/secure/users/1 \
  -H "Authorization: Bearer $BOB_TOKEN"

# Response (403 FORBIDDEN):
{
  "error": "Forbidden"
}
```

---

## Key Learning Points

### ❌ VULNERABLE Pattern
```javascript
app.get('/api/vulnerable/users/:id', (req, res) => {
  // NO authentication check
  // NO ownership check
  // Returns ALL sensitive fields
  res.json(users[req.params.id]);
});
```

**Attack:** Unauthenticated user can access any user's SSN, salary, bank account.

---

### ✅ SECURE Pattern
```javascript
app.get('/api/secure/users/:id', verifyToken, (req, res) => {
  // 1. JWT verification (middleware)
  if (!req.user) return res.status(401).json({ error: 'No token' });
  
  // 2. Ownership check
  if (req.user.id !== parseInt(req.params.id) && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  // 3. Sanitized response
  res.json({
    id: user.id,
    username: user.username,
    email: user.email
    // ssn, salary, bankAccount NOT included ✓
  });
});
```

**Defense:**
1. ✅ Requires JWT token
2. ✅ Checks user ownership OR admin role
3. ✅ Returns only safe fields

---

## Test Users (Hardcoded in Module 02)

| Email | Password | Role | ID |
|-------|----------|------|-----|
| `alice@example.com` | `password123` | admin | 1 |
| `bob@example.com` | `password456` | user | 2 |
| `charlie@example.com` | `password789` | user | 3 |

---

## Endpoints Reference

### Vulnerable Endpoints (No Auth)
```
GET  /api/vulnerable/users/:id          → Returns ALL user data
GET  /api/vulnerable/documents/:id      → Returns ANY document
GET  /api/vulnerable/invoices/:id       → Returns ANY invoice
PUT  /api/vulnerable/users/:id          → Modifies ANY user
```

### Secure Endpoints (Requires JWT)
```
POST /api/secure/login                  → Get JWT token
GET  /api/secure/users/:id              → Authorized access only
GET  /api/secure/documents/:id          → Owner or admin only
GET  /api/secure/invoices/:id           → Owner or admin only
PUT  /api/secure/users/:id              → Own data + admin check
```

### Lab Endpoints (Test Data)
```
GET  /api/lab/users                     → All users list
GET  /api/lab/documents                 → All documents list
GET  /api/lab/invoices                  → All invoices list
```

---

## What Happens (Behind the Scenes)

### Vulnerable Endpoint Flow
```
Browser Request
  ↓
No Authentication Check ← VULNERABLE!
  ↓
No Authorization Check ← VULNERABLE!
  ↓
Returns ALL fields ← VULNERABLE!
  ↓
Response sent
```

### Secure Endpoint Flow
```
Browser Request
  ↓
Extract JWT from Authorization header
  ↓
Verify JWT signature ← DEFENSE 1
  ↓
Extract user ID from JWT
  ↓
Check: Is requester == resource owner? ← DEFENSE 2
  ↓
Check: Is requester == admin? ← DEFENSE 3
  ↓
If all checks pass → Return SAFE fields only ← DEFENSE 4
  ↓
If checks fail → 403 Forbidden
  ↓
Response sent
```

---

## Real-World Breach Example

**Shopify Vulnerability (2015)**
- Attackers could access other merchants' private orders
- Similar to this module: No ownership verification
- Attackers retrieved customer data, payment info
- Estimated 1 million records exposed

**How Authorization Bypass Happened:**
```
GET /api/orders/12345  → Returns order for merchant A
GET /api/orders/12346  → Returns order for merchant B (EXPOSED!)
GET /api/orders/12347  → Returns order for attacker's target
```

**With BOLA/IDOR Prevention:**
```
GET /api/orders/12346  → 403 Forbidden (unless you own/admin)
```

---

## Logging & Debugging

### Check Server Logs
```bash
# Terminal where server is running shows:
[INFO] User alice (id:1) accessed own profile
[WARN] Unauthorized access attempt: user bob (id:2) tried accessing user 1
[ERROR] JWT verification failed: Invalid token
```

### Check Log Files
```bash
# Error logs
tail -f logs/error.log

# All logs
tail -f logs/combined.log
```

---

## Security Checklist After Testing

- [x] Understand the vulnerability (unauthorized data access)
- [x] See the attack work (vulnerable endpoints)
- [x] Understand the fix (ownership checks)
- [x] See the defense work (secure endpoints block attacks)
- [x] Learn real-world impact (Shopify breach)
- [x] Know prevention strategy (authorization middleware)

---

## Next Modules to Test

Once confident with Module 02, test others:

- **Module 03** (Port 4003): Mass Assignment - Try setting role=admin
- **Module 04** (Port 4004): Input Sanitization - Test XSS payloads
- **Module 14** (Port 4014): SQL Injection - Use ' OR '1'='1'
- **Module 15** (Port 4015): XSS/CSRF/SSRF - Combined trinity

---

## Troubleshooting

### Port Already in Use
```bash
# Kill the process using port 4002
lsof -ti:4002 | xargs kill -9

# Or change port in .env
HTTP_PORT=4003 npm start
```

### JWT Token Expired
```bash
# Tokens last 1 hour
# Get a new one with login endpoint
```

### CORS Errors
```bash
# Already configured for localhost:3000-3002
# Adjust in server.js if needed
```

---

**Created:** March 30, 2026  
**Module:** 02-BOLA-IDOR  
**Status:** Production Ready ✅
