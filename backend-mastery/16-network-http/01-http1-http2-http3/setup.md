# Module 01: Setup Guide

## Prerequisites
- Node.js 14+ installed
- npm or yarn
- Basic understanding of HTTP

## Installation

### 1. Install Dependencies
```bash
cd 01-http1-http2-http3
npm install
```

This will install:
- `express` - Web framework
- `cors` - Cross-Origin Resource Sharing
- `helmet` - Security headers
- `dotenv` - Environment variables
- `axios` - HTTP client (for testing)
- `nodemon` - Auto-reload on file changes (dev dependency)

### 2. Environment Setup
```bash
# Copy the example env file
cp .env.example .env

# Edit if needed (default port 5801 is fine)
```

The `.env` file should contain:
```
HTTP_PORT=5801
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

## Running the Server

### Development Mode (with auto-reload)
```bash
npm run dev
```

This uses `nodemon` to restart the server whenever you modify files.

**Expected output:**
```
[nodemon] 3.0.1
[nodemon] to restart at any time, type `rs`
[nodemon] watching path(s): *.*
[nodemon] watching extensions: js,json
Server running on port 5801
```

### Production Mode
```bash
npm start
```

Runs server without auto-reload (better for production).

## Testing the API

### Using cURL
```bash
# Check server health
curl http://localhost:5801/health

# Get protocol info
curl http://localhost:5801/api/protocol-info

# Compare HTTP versions
curl http://localhost:5801/api/compare

# Test multiplexing
curl http://localhost:5801/api/multiplexing

# Get performance data
curl http://localhost:5801/api/performance

# Load multiple resources
curl http://localhost:5801/api/resources/6
```

### Using the React Frontend
1. Make sure the server is running
2. Start a React development server (if not already running):
   ```bash
   npm run dev:react
   ```
3. Open `http://localhost:3000` in your browser
4. You'll see buttons to test various endpoints
5. Click buttons and observe responses

### Using Postman
1. Import endpoints from `/preview.html` or manually create:
   - **GET** http://localhost:5801/api/protocol-info
   - **GET** http://localhost:5801/api/compare
   - **GET** http://localhost:5801/api/multiplexing
   - **GET** http://localhost:5801/api/server-push
   - **GET** http://localhost:5801/api/performance
   - **GET** http://localhost:5801/api/resources/6

## How to Test

### 1. Protocol Information Test
```bash
npm run test:protocol-info
```
Shows what HTTP version your client is using.

### 2. Parallelization Test (Visual)
1. Start server: `npm run dev`
2. Open Chrome DevTools (F12)
3. Go to Network tab
4. Fetch `http://localhost:5801/api/resources/10`
5. Observe the timeline:
   - **HTTP/1.1**: Waterfall pattern (sequential batches)
   - **HTTP/2**: All parallel downloads

### 3. Multiplexing Comparison
```bash
# Open two terminals

# Terminal 1: Start HTTP/2 server
npm run dev

# Terminal 2: Run multiplexing test
curl http://localhost:5801/api/multiplexing
```

### 4. Performance Data Test
```bash
curl http://localhost:5801/api/performance | jq
```

(Requires `jq` for pretty printing)

## File Structure

```
01-http1-http2-http3/
├── server.js          # Express server setup
├── routes.js          # API route definitions
├── controller.js      # Business logic
├── middleware.js      # Custom middleware
├── schema.js          # Joi validation schemas
├── App.jsx            # React frontend
├── package.json       # Dependencies
├── .env.example       # Environment template
├── theory.md          # Concept explanations
├── README.md          # This module overview
├── setup.md           # This file
├── checklist.md       # Learning checklist
└── preview.html       # Static preview page
```

## Troubleshooting

### Port Already in Use
```bash
# Error: listen EADDRINUSE: address already in use :::5801

# Solution: Change port in .env
echo "HTTP_PORT=5802" >> .env

# Or kill the process
lsof -i :5801 | grep LISTEN | awk '{print $2}' | xargs kill -9
```

### CORS Error When Accessing from Browser
```
Access to XMLHttpRequest blocked by CORS policy

# Solution: Make sure FRONTEND_URL in .env matches your frontend URL
# If running frontend on localhost:3000:
FRONTEND_URL=http://localhost:3000
```

### Dependencies Installation Failed
```bash
# Clear npm cache
npm cache clean --force

# Remove lock file
rm package-lock.json

# Reinstall
npm install
```

### DevTools Network Tab is Empty
1. Make sure DevTools is open BEFORE making requests
2. Check that resources tab is selected (not Console)
3. Check that the filter isn't hiding requests
4. Ensure "Preserve log" is checked if testing navigation

## Performance Benchmarking

### Using Apache Bench
```bash
# Test with 100 requests
ab -n 100 -c 10 http://localhost:5801/api/resources/10

# c = concurrent requests
# n = total requests
```

### Using wrk (More advanced)
```bash
# Install: brew install wrk

# Test: 4 threads, 100 connections, 30 second test
wrk -t 4 -c 100 -d 30s http://localhost:5801/api/resources/10
```

## Learning Checklist

- [ ] Understand HTTP/1.0 limitations
- [ ] Understand HTTP/1.1 improvements (Keep-Alive)
- [ ] Understand HTTP/2 multiplexing
- [ ] Understand HTTP/3 QUIC protocol
- [ ] See parallelization in DevTools Network tab
- [ ] Compare response times between protocols
- [ ] Know when to use each protocol version
- [ ] Understand trade-offs and limitations

---

**Ready to start?** Run `npm run dev` and open `http://localhost:5801` in your browser!
