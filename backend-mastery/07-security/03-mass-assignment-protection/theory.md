# Mass Assignment Protection - Comprehensive Theory

## What is Mass Assignment?

Mass assignment is a security vulnerability that occurs when an application automatically assigns HTTP request parameters to object properties without proper filtering or validation. This allows attackers to modify fields that should not be user-editable, particularly sensitive fields like `role`, `is_admin`, `permissions`, or `price`.

### Real-World Example
Imagine an e-commerce API where users should only be able to edit their profile information:

```javascript
// VULNERABLE: Accepts all fields from request
POST /api/users/update HTTP/1.1
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "is_admin": true,      // Attacker adds this
  "role": "admin",       // Attacker adds this
  "price_override": 0.01 // Attacker modifies price
}
```

If the server accepts all fields, the attacker becomes an admin or can purchase items for $0.01.

---

## How Mass Assignment Works

### The Attack Vector

1. **Identify Sensitive Fields**
   - Backend database might have: `id`, `name`, `email`, `password`, `role`, `is_admin`, `permissions`, `balance`
   - User should only edit: `name`, `email`
   - System controls: `role`, `is_admin`, `balance`

2. **Craft Malicious Request**
   ```javascript
   POST /api/profile HTTP/1.1
   {
     "name": "John",
     "role": "moderator",  // Not supposed to be editable!
     "balance": 1000000     // Try to set balance
   }
   ```

3. **Server Processes All Fields**
   ```javascript
   // VULNERABLE CODE
   const user = req.body;  // Takes everything!
   database.update(user);  // Saves all fields
   ```

4. **Attacker Gains Unauthorized Access**
   - Becomes admin/moderator
   - Increases balance
   - Changes permissions
   - Escalates privileges

### CVSS Score Analysis

**CVSS 7.8 (HIGH)**
- Attack Vector: Network
- Attack Complexity: Low
- Privileges Required: Low (user account needed)
- User Interaction: None
- Scope: Changed (affects other users/system)
- Confidentiality: None (not data theft)
- Integrity: High (can modify data)
- Availability: None

---

## Real-World Breaches

### 1. GitHub Mass Assignment (2012)
**The Incident:**
- User could modify repository settings by adding parameters
- Attacker could add themselves as collaborator
- Could gain write access to private projects

**Impact:**
- Access to private code
- Ability to modify repositories
- Potential data leakage

### 2. Airbnb Privilege Escalation
**The Incident:**
- Users could set their own account role to "admin"
- POST parameters not validated

**Impact:**
- Unauthorized access to user data
- Can delete listings
- Can moderate content

### 3. Stripe Early Days
**The Incident:**
- API accepted extra parameters
- Developers could modify internal fields

**Impact:**
- Changed transaction amounts
- Modified account status

---

## Technical Deep Dive

### Why It Happens

#### Problem 1: Dynamic Assignment
```javascript
// VULNERABLE: JavaScript allows dynamic assignment
const user = {};
for (let key in req.body) {
  user[key] = req.body[key];  // Assigns EVERYTHING
}
await User.update(user);
```

#### Problem 2: Object Spreading
```javascript
// VULNERABLE: Spreading spreads all properties
const updatedUser = {
  ...req.body,  // Could include is_admin, role, etc.
  id: userId
};
await User.update(updatedUser);
```

#### Problem 3: Implicit Binding
```javascript
// VULNERABLE: Some frameworks auto-bind all params
router.post('/users', (req, res) => {
  new User(req.body).save();  // Binds all properties
});
```

### Attack Scenarios

#### Scenario 1: Privilege Escalation
```
Normal user POST:
{
  "name": "Alice",
  "email": "alice@example.com"
}

Attacker POST:
{
  "name": "Hacker",
  "email": "hacker@example.com",
  "role": "admin",
  "is_admin": true,
  "permissions": ["delete_users", "edit_settings"]
}

Result: Attacker becomes admin
```

#### Scenario 2: Price Manipulation
```
Normal request:
{
  "product_id": 123,
  "quantity": 1
}

Malicious request:
{
  "product_id": 123,
  "quantity": 1,
  "price": 0.01,
  "discount": 99.99
}

Result: Item purchased for $0.01
```

#### Scenario 3: Account Takeover
```
Attacker takes existing user account:
{
  "username": "target_user",
  "password": "their_password_hash",
  "email": "attacker@evil.com",
  "recovery_email": "attacker@evil.com"
}

Result: Changes recovery email, takes over account
```

#### Scenario 4: Metadata Manipulation
```
User sends:
{
  "message": "Hello"
}

Attacker adds:
{
  "message": "Hello",
  "sender_id": "admin_id",
  "priority": "urgent",
  "is_verified": true
}

Result: Forges message from admin
```

---

## Prevention Strategies

### Strategy 1: Whitelist Approach (RECOMMENDED)

Explicitly list which fields users can modify:

```javascript
const ALLOWED_FIELDS = ['name', 'email', 'bio', 'phone'];

const updateUser = (req, res) => {
  const updates = {};
  
  // Only copy allowed fields
  ALLOWED_FIELDS.forEach(field => {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  });
  
  await User.findByIdAndUpdate(req.user.id, updates);
  res.json({ message: 'Profile updated' });
};
```

### Strategy 2: Schema Validation with Joi

Use schema validation to define allowed fields:

```javascript
const joi = require('joi');

const updateUserSchema = joi.object({
  name: joi.string().max(100),
  email: joi.string().email(),
  phone: joi.string().pattern(/^[0-9-]+$/),
  // role, is_admin, balance are NOT in schema
}).unknown(false);  // Reject unknown fields

const updateUser = (req, res) => {
  const { error, value } = updateUserSchema.validate(req.body);
  
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  
  await User.findByIdAndUpdate(req.user.id, value);
  res.json({ message: 'Updated' });
};
```

### Strategy 3: Blacklist Approach (NOT RECOMMENDED)

Block specific dangerous fields (less secure):

```javascript
const BLOCKED_FIELDS = ['id', 'password', 'role', 'is_admin', 'balance'];

const updateUser = (req, res) => {
  const updates = { ...req.body };
  
  // Remove blocked fields
  BLOCKED_FIELDS.forEach(field => delete updates[field]);
  
  await User.findByIdAndUpdate(req.user.id, updates);
  res.json({ message: 'Updated' });
};
```

⚠️ **Problem:** If new fields added later, they're automatically allowed.

### Strategy 4: DTO (Data Transfer Object)

Create explicit data transfer objects:

```javascript
class UserUpdateDTO {
  constructor(data) {
    this.name = data.name;
    this.email = data.email;
    this.phone = data.phone;
    // Only these fields are copied
  }
}

const updateUser = (req, res) => {
  const dto = new UserUpdateDTO(req.body);
  await User.findByIdAndUpdate(req.user.id, dto);
  res.json({ message: 'Updated' });
};
```

### Strategy 5: Explicit Field Assignment

Manually copy each field:

```javascript
const updateUser = (req, res) => {
  const user = await User.findById(req.user.id);
  
  // Explicitly assign fields
  if (req.body.name) user.name = req.body.name;
  if (req.body.email) user.email = req.body.email;
  if (req.body.phone) user.phone = req.body.phone;
  
  // Never assign these:
  // user.role = req.body.role;     // NO!
  // user.is_admin = req.body.is_admin;  // NO!
  // user.balance = req.body.balance;    // NO!
  
  await user.save();
  res.json({ message: 'Updated' });
};
```

---

## Implementation Comparison

| Method | Security | Maintainability | Performance |
|--------|----------|-----------------|-------------|
| Whitelist | ✅ Excellent | ⭐⭐⭐ Easiest | ✅ Fast |
| Joi Schema | ✅ Excellent | ⭐⭐⭐ Clear | ✅ Fast |
| Blacklist | ⚠️ Risky | ⭐ Hard | ✅ Fast |
| DTO | ✅ Good | ⭐⭐⭐ Clear | ⭐⭐ Slower |
| Manual | ✅ Excellent | ⭐ Tedious | ⭐⭐ Slow |

**BEST PRACTICE:** Use Joi Schema validation with `.unknown(false)`

---

## Detection

### How to Find Mass Assignment Vulnerabilities

1. **Intercept Requests**
   - Use Burp Suite or OWASP ZAP
   - Intercept POST/PUT requests
   - Try adding extra fields

2. **Examine Response**
   - Check if new fields are returned
   - Look for unexpected data
   - Compare before/after

3. **List All Database Fields**
   - Enumerate database schema
   - Try adding each field in request
   - Watch for changes in response

4. **Look for Admin Functions**
   - Try to set `is_admin: true`
   - Try to set `role: "admin"`
   - Try to set `permissions`

### Testing Payloads

```bash
# Test 1: Try to become admin
curl -X POST http://localhost:4003/api/vulnerable/users \
  -H "Content-Type: application/json" \
  -d '{"name": "Attacker", "email": "attacker@test.com", "is_admin": true}'

# Test 2: Try to set role
curl -X POST http://localhost:4003/api/vulnerable/users \
  -H "Content-Type: application/json" \
  -d '{"name": "Attacker", "role": "moderator"}'

# Test 3: Try to manipulate balance
curl -X POST http://localhost:4003/api/vulnerable/users \
  -H "Content-Type: application/json" \
  -d '{"name": "Attacker", "balance": 999999}'
```

---

## Best Practices Checklist

- ✅ Use whitelist approach (allow specific fields)
- ✅ Never trust request data directly
- ✅ Validate all input with schema
- ✅ Use `.unknown(false)` to reject extra fields
- ✅ Log attempts to modify protected fields
- ✅ Test with common field names (admin, role, is_admin, balance)
- ✅ Review all CRUD endpoints for mass assignment
- ✅ Use framework features (DTO, validation decorators)
- ✅ Separate user-editable from system-controlled fields
- ✅ Document which fields are user-modifiable

---

## Key Takeaways

1. **Mass assignment happens when developers don't validate field assignments**
2. **Common vulnerable fields: role, is_admin, balance, permissions, discount**
3. **Whitelisting is the safest approach**
4. **Schema validation with `.unknown(false)` prevents surprises**
5. **Always separate user-editable from system-controlled fields**
6. **Test every POST/PUT endpoint for mass assignment**
7. **Log suspicious attempts to modify protected fields**

---

## Resources

- [OWASP: Mass Assignment](https://owasp.org/www-community/Mass_Assignment)
- [CWE-915: Improperly Controlled Modification](https://cwe.mitre.org/data/definitions/915.html)
- [Joi Documentation](https://joi.dev/)
- [Express Best Practices](https://expressjs.com/en/advanced/best-practice-performance.html)
