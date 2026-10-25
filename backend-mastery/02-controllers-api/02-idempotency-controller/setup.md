# Setup Guide - Idempotency Controller

## Dependencies

```bash
npm install express mongoose dotenv uuid jsonwebtoken
```

### Optional (for testing):
```bash
npm install --save-dev jest supertest
```

## Environment Variables

Copy `.env.example` to `.env` and fill in:

```bash
# .env file
MONGODB_URI=mongodb://localhost:27017/idempotency
SERVER_PORT=5000
NODE_ENV=development
JWT_SECRET=your-super-secret-key-123
IDEMPOTENCY_TTL_HOURS=24
IDEMPOTENCY_ENABLED=true
```

## File Creation Order

### 1. **schema.js** (First)
   - Define the IdempotencyKey model
   - This is your data layer - needed before middleware

### 2. **middleware.js** (Second)
   - Create idempotency middleware
   - Imports the schema, adds logic

### 3. **controller.js** (Third)
   - Write API endpoint handlers
   - Business logic using middleware

### 4. **.env.example**
   - Document environment variables needed

### 5. **routes.js** (Fourth)
   - Connect middleware + controller + routes
   - Register all endpoints

### 6. **README.md**
   - Explanation for other developers

### 7. **setup.md** (This file)
   - Installation & running instructions

### 8. **theory.md**
   - Deep dive into how idempotency works

## How to Run

### 1. Start MongoDB
```bash
# If using local MongoDB
mongod

# Or Docker:
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### 2. Install dependencies
```bash
npm install
```

### 3. Create `.env` file from example
```bash
cp .env.example .env
# Edit .env with your values
```

### 4. Run the server
```bash
node server.js
```

Server should start on `http://localhost:5000`

### 5. Test with cURL or Postman

```bash
# Set Idempotency-Key header
curl -X POST http://localhost:5000/api/transactions \
  -H "Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer your_jwt_token" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 100,
    "recipientId": "user123",
    "description": "Payment for order #123"
  }'
```

## How to Test

### Manual Testing with cURL

**Test 1: First request (should create)**
```bash
KEY="550e8400-e29b-41d4-a716-446655440001"

curl -X POST http://localhost:5000/api/transactions \
  -H "Idempotency-Key: $KEY" \
  -H "Authorization: Bearer token" \
  -H "Content-Type: application/json" \
  -d '{"amount": 100, "recipientId": "user123"}'

# Result: 201 Created with transaction ID
```

**Test 2: Retry with same key (should return cached)**
```bash
KEY="550e8400-e29b-41d4-a716-446655440001"

curl -X POST http://localhost:5000/api/transactions \
  -H "Idempotency-Key: $KEY" \
  -H "Authorization: Bearer token" \
  -H "Content-Type: application/json" \
  -d '{"amount": 100, "recipientId": "user123"}'

# Result: 201 Created with SAME transaction ID (cached)
```

**Test 3: Same key, different body (should reject)**
```bash
KEY="550e8400-e29b-41d4-a716-446655440001"

curl -X POST http://localhost:5000/api/transactions \
  -H "Idempotency-Key: $KEY" \
  -H "Authorization: Bearer token" \
  -H "Content-Type: application/json" \
  -d '{"amount": 200, "recipientId": "user456"}'

# Result: 422 Unprocessable Entity - "Idempotency key reused with different request body"
```

**Test 4: Missing Idempotency-Key (should fail)**
```bash
curl -X POST http://localhost:5000/api/transactions \
  -H "Authorization: Bearer token" \
  -H "Content-Type: application/json" \
  -d '{"amount": 100, "recipientId": "user123"}'

# Result: 400 Bad Request - "Idempotency-Key header is required"
```

### Integration Tests

```bash
npm test
```

### Automated Testing Script

```javascript
// test-idempotency.js
const axios = require('axios');

const API = 'http://localhost:5000/api';
const TOKEN = 'your-jwt-token';
const KEY = '550e8400-e29b-41d4-a716-446655440099';

async function testIdempotency() {
  try {
    // First request
    console.log('Test 1: First request...');
    const res1 = await axios.post(`${API}/transactions`, 
      { amount: 100, recipientId: 'user123' },
      {
        headers: {
          'Idempotency-Key': KEY,
          'Authorization': `Bearer ${TOKEN}`,
        }
      }
    );
    console.log('✅ First request:', res1.data.transaction.id);

    // Retry (should be cached)
    console.log('\nTest 2: Retry with same key...');
    const res2 = await axios.post(`${API}/transactions`,
      { amount: 100, recipientId: 'user123' },
      {
        headers: {
          'Idempotency-Key': KEY,
          'Authorization': `Bearer ${TOKEN}`,
        }
      }
    );
    console.log('✅ Cached response:', res2.data.transaction.id);
    console.log('Same ID?', res1.data.transaction.id === res2.data.transaction.id);

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testIdempotency();
```

Run with: `node test-idempotency.js`

## Checking MongoDB

Verify idempotency keys are being stored:

```bash
# Connect to MongoDB
mongo

# In MongoDB shell:
use idempotency
db.idempotencykeys.find().pretty()

# Should show records with status 'completed'
```

## Troubleshooting

### "Idempotency-Key header is required"
- Check that your request includes the header
- Header name is case-insensitive in Express

### "Idempotency key reused with different request body"
- You're using the same key for different requests
- Generate a new UUID for each unique request

### "Request still being processed"
- First request is still being processed
- Wait a moment and retry

### MongoDB connection errors
- Ensure MongoDB is running: `mongod`
- Check MONGODB_URI in .env
- Verify connection string format

## Next Steps

1. Read `theory.md` to understand the deep mechanics
2. Implement error handling and logging
3. Add metrics/monitoring for cache hit rates
4. Test with your actual payment/order service
5. Deploy to production with proper auth middleware

