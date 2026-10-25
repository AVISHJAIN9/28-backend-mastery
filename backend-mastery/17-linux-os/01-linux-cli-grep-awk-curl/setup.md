# Setup Guide

## Dependencies
```bash
npm install
```
Installs: express, cors, helmet, dotenv

## Environment Variables
Create `.env` file:
```
HTTP_PORT=5701
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

## How to test
1. Health check: `http://localhost:5701/health`
2. API info: `http://localhost:5701/api/info`
3. Test grep: `http://localhost:5701/api/grep?pattern=test&text=test%20data`
4. Test awk: `http://localhost:5701/api/awk?data=name:age;John:25`
5. Test curl: `http://localhost:5701/api/curl?url=https://example.com`

## Interactive UI
Open `preview.html` in browser for interactive testing
