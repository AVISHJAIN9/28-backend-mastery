# Setup Guide

## Dependencies
```bash
npm install
```
Required packages:
- express - Web framework
- bcrypt - Password hashing
- cors - Cross-origin requests
- helmet - Security headers
- dotenv - Environment variables

## Environment Variables
Create `.env` file:
```
HTTP_PORT=5801
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

## How to run
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

Server will start on http://localhost:5801

## How to test

### API Testing
1. Health check: `http://localhost:5801/health`
2. API info: `http://localhost:5801/api/info`
3. Hash password: `http://localhost:5801/api/hash/bcrypt?password=myPassword123`
4. Verify hash: `http://localhost:5801/api/verify/bcrypt?password=myPassword123&hash=HASH_FROM_ABOVE`
5. SHA256: `http://localhost:5801/api/hash/sha256?text=hello%20world`
6. Compare: `http://localhost:5801/api/compare?text1=password&text2=passwor`

### Using curl
```bash
# Hash password
curl "http://localhost:5801/api/hash/bcrypt?password=test123"

# Verify hash
curl "http://localhost:5801/api/verify/bcrypt?password=test123&hash=\$2b\$12\$..."

# SHA256 hash
curl "http://localhost:5801/api/hash/sha256?text=hello"
```

### Interactive UI
Open `preview.html` in browser for interactive testing

## Testing workflow
1. Generate hash with bcrypt endpoint
2. Copy the hash from response
3. Use verify endpoint with original password and hash
4. Try with wrong password to see failure
5. Compare hashing speeds with SHA256
