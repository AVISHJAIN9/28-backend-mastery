# JWT Key Rotation Setup

## Installation

```bash
cd 28-jwt-key-rotation
npm install express jsonwebtoken jwt-simple uuid joi cors dotenv
```

## Server Setup

```javascript
// server.js
const express = require('express');
const require('dotenv').config();
const routes = require('./routes');

const app = express();
app.use(express.json());
app.use('/keys', routes);

app.listen(3000, () => {
  console.log('✅ Running on http://localhost:3000');
});
```

## API Endpoints

### Register & Get Token
```bash
curl -X POST http://localhost:3000/keys/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "Pass123!",
    "name": "John Doe"
  }'
```

Response includes JWT token signed with current active key.

### Get Public Keys
```bash
curl http://localhost:3000/keys/public
```

Returns all active and deprecated keys for validation.

### Verify Token
```bash
curl -X POST http://localhost:3000/keys/verify \
  -H "Content-Type: application/json" \
  -d '{"token": "jwt_token_here"}'
```

### Rotate Keys
```bash
curl -X POST http://localhost:3000/keys/rotate
```

Deprecates current key, generates new one.

### Check Rotation History
```bash
curl http://localhost:3000/keys/history
```

## Production Considerations

- Use HSM or KMS for key storage (AWS KMS, HashiCorp Vault)
- Automate rotation using cron jobs
- Monitor key expiration with alerts
- Implement metrics for validation failures
- Use HTTPS for all endpoints
- Add rate limiting
- Implement audit logging
