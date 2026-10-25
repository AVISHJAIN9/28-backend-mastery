# Setup Guide - Unit Tests Jest Vitest

## Quick Setup (5 minutes)

### 1. Install Dependencies
```bash
cd 01-unit-tests-jest-vitest
npm install
```

### 2. Create Environment File
```bash
cp .env.example .env
```

### 3. Start Development Server
```bash
npm run dev
```

### 4. Access the Application  
- **Backend API:** http://localhost:5401
- **Health Check:** http://localhost:5401/health
- **React UI:** http://localhost:3000 (if running React dev server)

## What Gets Installed

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "helmet": "^7.0.0",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
```

## Environment Variables

Configure these in `.env`:

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | development | Node environment |
| `HTTP_PORT` | 5401 | Server port |
| `FRONTEND_URL` | http://localhost:3000 | Frontend URL for CORS |
| `TEST_TIMEOUT` | 10000 | Test timeout in ms |
| `COVERAGE_THRESHOLD` | 80 | Coverage threshold % |
| `LOG_LEVEL` | info | Logging level |
| `ENABLE_COVERAGE_REPORTS` | true | Enable coverage reports |

## Project Structure

```
01-unit-tests-jest-vitest/
├── server.js              # Express server entry point
├── routes.js              # API route definitions
├── controller.js          # Business logic & testable functions
├── middleware.js          # Express middleware
├── schema.js              # Input validation schemas (Joi)
├── App.jsx                # React testing UI
├── theory.md              # Learning material
├── package.json           # Dependencies & scripts
├── .env.example           # Environment template
├── checklist.md           # Learning checklist
└── README.md              # Module documentation
```

## Available NPM Scripts

```bash
# Start development server with hot reload
npm run dev

# Start production server
npm start

# Run tests (placeholder for now)
npm test

# Open in browser automatically
npm run dev -- --open
```

## Testing the API

### Using cURL

```bash
# Test math operations
curl -X POST http://localhost:5401/api/test/unit-math \
  -H "Content-Type: application/json" \
  -d '{"operation": "add", "a": 5, "b": 3}'

# Test email validation
curl -X POST http://localhost:5401/api/test/validate-email \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'

# Test password validation
curl -X POST http://localhost:5401/api/test/validate-password \
  -H "Content-Type: application/json" \
  -d '{"password": "StrongPass123!"}'

# Create a user
curl -X POST http://localhost:5401/api/test/users \
  -H "Content-Type: application/json" \
  -d '{"name": "Alice", "email": "alice@test.com", "password": "Password123!"}'

# Get all users
curl http://localhost:5401/api/test/users

# Get module info
curl http://localhost:5401/api/test/info
```

### Using React UI

The interactive React component provides buttons for all endpoints:

1. **Math Tab** - Test mathematical operations
2. **Validation Tab** - Test email/password validators
3. **Users Tab** - Test CRUD operations
4. **Calculations Tab** - Test discount, tax, average calculations
5. **Strings Tab** - Test string operations
6. **Utilities Tab** - Test module utilities

## How the Testing Module Works

### 1. Units Being Tested

Functions in `controller.js` that are tested:
- Math operations: `add()`, `subtract()`, `multiply()`, `divide()`
- Validators: `validateEmail()`, `validatePassword()`, `validateName()`
- User CRUD: `createUser()`, `getUser()`, `updateUser()`, `deleteUser()`
- Array operations: `filterUsersByAge()`, `groupUsersByAge()`
- Calculations: `calculateDiscount()`, `calculateTax()`, `calculateAverage()`
- String operations: `capitalize()`, `reverseString()`, `isPalindrome()`

### 2. Test Endpoints

Each function has a corresponding API endpoint that exercises it:

```
Math: POST /api/test/unit-math
Email: POST /api/test/validate-email
Password: POST /api/test/validate-password
Users: POST /api/test/users (create)
       GET /api/test/users (list)
       GET /api/test/users/:id (read)
       PUT /api/test/users/:id (update)
       DELETE /api/test/users/:id (delete)
```

### 3. Test Scenarios

Each endpoint demonstrates different testing aspects:

**Happy Path Testing:**
- Valid inputs produce expected outputs
- Functions behave correctly under normal conditions

**Edge Case Testing:**
- Zero values
- Maximum values
- Empty inputs
- Boundary conditions

**Error Path Testing:**
- Invalid inputs throw appropriate errors
- Error messages are informative
- Status codes are correct

## Writing Your Own Tests

### Example 1: Test a Simple Function

```javascript
// In controller.js
const multiplyByTwo = (n) => {
  if (typeof n !== 'number') throw new Error('Must be a number');
  return n * 2;
};

// In routes.js - add endpoint
router.post('/test/multiply-by-two', (req, res) => {
  try {
    const { number } = req.body;
    const result = controller.multiplyByTwo(number);
    req.sendSuccess({ input: number, result });
  } catch (error) {
    req.sendError(error.message, 400);
  }
});

// In App.jsx - add test button
<button onClick={() => executeTest('/test/multiply-by-two', 'POST', { number: 5 })}>
  Test: 5 * 2
</button>
```

### Example 2: Test with Different Inputs

```javascript
const testCases = [
  { input: 0, expected: 0 },
  { input: 5, expected: 10 },
  { input: -3, expected: -6 }
];

for (const test of testCases) {
  executeTest('/test/multiply-by-two', 'POST', { number: test.input });
}
```

## Troubleshooting

### Port Already in Use

Error: `Error: listen EADDRINUSE: address already in use :::5401`

Solution:
```bash
# Kill existing Node processes
killall node

# Or change the port in .env
HTTP_PORT=5402
```

### Module Not Found Errors

Error: `Cannot find module 'express'`

Solution:
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### CORS Errors

Error: `Access to XMLHttpRequest blocked by CORS policy`

Solution:
1. Ensure `FRONTEND_URL` is set correctly in `.env`
2. Restart the server
3. Check browser console for exact origin

### Tests Running Slowly

**Causes:**
- Too many database operations
- Missing async/await handling
- Inefficient queries

**Solutions:**
- Use mocks instead of real database
- Properly handle promises
- Optimize data operations

## Next Steps

1. **Read theory.md** - Understand unit testing concepts (20 min)
2. **Explore endpoints** - Test via React UI or cURL (10 min)
3. **Review code** - Study the test functions in controller.js (15 min)
4. **Try examples** - Run the provided test cases (10 min)
5. **Add own tests** - Create new endpoints following the pattern (20 min)

## Performance Tips

- Run tests in parallel when possible
- Cache test data between runs
- Use test utilities like `/api/test/reset` to clean state
- Monitor response times with `/api/test/info`

## Resources

- [Express.js Guide](https://expressjs.com/)
- [Jest Documentation](https://jestjs.io/)
- [Joi Validation](https://joi.dev/)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)

## Getting Help

- Check `README.md` for overview
- Review `theory.md` for concepts
- Check error messages in response
- Use `/api/test/info` for endpoint list
