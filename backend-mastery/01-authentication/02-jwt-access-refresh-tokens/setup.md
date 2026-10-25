# Setup Guide - JWT Access/Refresh Tokens

## Prerequisites

- Node.js 14+ 
- npm or yarn
- Postman or curl for API testing
- Basic understanding of JWT concepts

## Installation

### 1. Install Dependencies

```bash
npm install express jsonwebtoken bcryptjs joi uuid axios dotenv cors
```

### Required Packages

| Package | Purpose |
|---------|---------|
| `express` | Web framework |
| `jsonwebtoken` | JWT creation and verification |
| `bcryptjs` | Password hashing |
| `joi` | Request validation |
| `uuid` | Generate unique IDs |
| `axios` | HTTP client for frontend |
| `dotenv` | Environment variables |
| `cors` | Enable CORS |

### 2. Environment Setup

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
JWT_SECRET=your-super-secret-key-minimum-32-characters
JWT_REFRESH_SECRET=your-super-secret-refresh-key-32-chars
NODE_ENV=development
PORT=3000
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d
```

### 3. Generate Strong Secrets

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Run this command twice for JWT_SECRET and JWT_REFRESH_SECRET.

## Backend Setup

### Project Structure

```
project/
├── controller.js       # Business logic
├── middleware.js       # Auth middlewares
├── routes.js          # Express routes
├── schema.js          # Joi validation schemas
├── .env               # Environment variables
├── .env.example       # Example env
└── server.js          # Optional entry point
```

### Create server.js

```javascript
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/auth', authRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### Run Backend

```bash
node server.js
```

Server runs on `http://localhost:3000`

## Frontend Setup

### Project Structure

```
client/
├── App.jsx
├── index.jsx
├── package.json
└── .env
```

### Create .env for Frontend

```env
VITE_API_URL=http://localhost:3000
```

### Install Frontend Dependencies

```bash
npm install react axios react-dom
```

### Run with Vite

```bash
npm run dev
```

Frontend runs on `http://localhost:5173`

## Testing the Implementation

### Using Curl

#### 1. Register a User

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123",
    "name": "John Doe"
  }'
```

Response:
```json
{
  "message": "User registered successfully",
  "user": { "id": "...", "email": "user@example.com", "name": "John Doe" },
  "tokens": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc...",
    "expiresIn": "15m"
  }
}
```

#### 2. Make Authenticated Request

```bash
curl -X GET http://localhost:3000/auth/me \
  -H "Authorization: Bearer <your_access_token>"
```

#### 3. Refresh Token

```bash
curl -X POST http://localhost:3000/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "<your_refresh_token>"
  }'
```

#### 4. Logout

```bash
curl -X POST http://localhost:3000/auth/logout \
  -H "Authorization: Bearer <your_access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "<your_refresh_token>"
  }'
```

### Using Postman

1. **Create Collection**: JWT Auth
2. **Create Environment Variables**:
   - `api_url`: http://localhost:3000
   - `accessToken`: (will be set after login)
   - `refreshToken`: (will be set after login)

3. **POST Register**:
   - URL: `{{api_url}}/auth/register`
   - Body: JSON with email, password, name

4. **POST Login**:
   - URL: `{{api_url}}/auth/login`
   - Body: JSON with email, password
   - Tests script:
   ```javascript
   pm.environment.set("accessToken", pm.response.json().tokens.accessToken);
   pm.environment.set("refreshToken", pm.response.json().tokens.refreshToken);
   ```

5. **GET /me**:
   - URL: `{{api_url}}/auth/me`
   - Auth: Bearer Token `{{accessToken}}`

6. **POST Refresh**:
   - URL: `{{api_url}}/auth/refresh`
   - Body: `{ "refreshToken": "{{refreshToken}}" }`

## Troubleshooting

### Token Verification Fails

**Error**: `JsonWebTokenError: invalid signature`

**Solution**: Ensure JWT_SECRET matches between server and verify calls

### CORS Errors

**Error**: `Access to XMLHttpRequest blocked by CORS policy`

**Solution**: Ensure CORS middleware is added before routes:
```javascript
app.use(cors({
  origin: 'http://localhost:3173',
  credentials: true
}));
```

### Token Expired Errors

**Error**: `TokenExpiredError: jwt expired`

**Solution**: This is normal. Use the refresh endpoint with refresh token.

### Password Validation Fails

**Error**: `"password" with value "..." fails to match the required pattern`

**Solution**: Password must be 8+ chars with uppercase, lowercase, and numbers

## Database Integration

Replace in-memory Maps with database:

```javascript
// Instead of:
const users = new Map();

// Use:
const User = require('./models/User'); // Mongoose/Sequelize model

// Then:
const user = await User.findOne({ email });
await User.create({ email, password: hashedPassword, name });
```

## Production Deployment

1. **Use RS256 instead of HS256** for key rotation
2. **Store refresh tokens in database** with expiration
3. **Implement token blacklist/whitelist** for added security
4. **Use environment secrets manager** (AWS Secrets Manager, HashiCorp Vault)
5. **Enable rate limiting** on auth endpoints
6. **Implement request logging** for audit trails
7. **Use HTTPS only** in production
8. **Set secure cookie flags** (HttpOnly, Secure, SameSite)
9. **Monitor token usage patterns** for fraud detection
10. **Implement metric/alerts** for failed auth attempts

## Environment Variables
## How to run
## How to test
