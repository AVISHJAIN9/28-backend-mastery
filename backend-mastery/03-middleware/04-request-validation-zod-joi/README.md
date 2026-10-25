# Request Validation Middleware

## What is this?
Input validation middleware uses schemas (Joi/Zod) to validate request bodies before they reach route handlers, preventing invalid data from being processed.

## Why does it matter?
- **Security**: Prevents SQL injection, XSS, buffer overflow
- **Data Integrity**: Ensures data matches expected format
- **Early Detection**: Fails fast on invalid input
- **Consistent Format**: Coerces/transforms data to correct types
- **User Feedback**: Clear error messages for invalid input
- **Reduced Bugs**: Handlers assume valid data

## How it works (step by step)
1. Request arrives with JSON body
2. Validation middleware intercepts
3. Schema defines expected structure
4. Joi validates body against schema
5. If invalid: Return 400 with error details
6. If valid: Attach validated data to req.validatedData
7. Proceed to route handler with clean data

## Key concepts
- **Schema**: Defines expected structure (type, length, format)
- **Joi**: Popular schema validation library for Node.js
- **Coercion**: Auto-converting types (string "5" to number 5)
- **Error Messages**: Clear feedback on what's invalid
- **Early Validation**: Prevents route handler from invalid data
- **Reusable Schemas**: Define once, use everywhere

## Common mistakes
- Validating after using data (should be first)
- Not providing clear error messages
- Making schemas too strict (rejecting valid data)
- Duplicating validation logic in multiple routes
- Not sanitizing/escaping on top of validation

## Real world usage
```javascript
// Define schema
const userSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  age: Joi.number().min(18).optional()
});

// Apply validation middleware
app.post('/register', validateMiddleware(userSchema), (req, res) => {
  // req.validatedData contains clean, valid data
  const { email, password, age } = req.validatedData;
  // Safe to use...
});

// Invalid request returns:
// { error: 'Validation failed', details: ['email must be valid email'] }
```
