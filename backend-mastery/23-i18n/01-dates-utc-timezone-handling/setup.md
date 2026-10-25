# Setup Guide - Module 23.1: Dates, UTC & Timezone Handling

## Prerequisites

- Node.js v16+ 
- npm or yarn
- Basic knowledge of JavaScript

## Installation

```bash
# Navigate to module directory
cd 01-dates-utc-timezone-handling

# Install dependencies
npm install

# Copy environment template
cp .env.example .env
```

## Environment Variables

Create a `.env` file based on `.env.example`:

```env
# Server Configuration
HTTP_PORT=5401
NODE_ENV=development

# Logging
LOG_LEVEL=info
LOG_FILE=combined.log
```

## How to Run

### Development Mode (with auto-reload)

```bash
npm run dev
```

Server starts on `http://localhost:5401`

### Production Mode

```bash
npm start
```

### Run Tests

```bash
npm test
```

## Quick Test

Once the server is running, test an endpoint:

```bash
# Check current time in multiple timezones
curl http://localhost:5401/api/now

# Convert timestamp to multiple zones
curl http://localhost:5401/api/convert/1711756800

# Check if date is in DST
curl http://localhost:5401/api/dst-check/2024-03-10/America/New_York
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Server status check |
| GET | `/api/now` | Current time in multiple timezones |
| GET | `/api/convert/:timestamp` | Convert Unix timestamp to multiple zones |
| GET | `/api/dst-check/:date/:timezone` | Check if date is in DST |
| POST | `/api/schedule` | Schedule event respecting timezone |
| GET | `/api/timezones` | List all supported timezones |

## Troubleshooting

### Port Already in Use

```bash
# Kill existing Node process
lsof -ti:5401 | xargs kill -9

# Or change port in .env
HTTP_PORT=5402
```

### Module Not Found Errors

Re-install dependencies:

```bash
rm -rf node_modules package-lock.json
npm install
```

### Unable to Connect to Server

1. Verify Node is running: `ps aux | grep node`
2. Check port is correct in `.env`
3. Check firewall settings
4. Try `curl http://localhost:5401/api/health`

## Project Structure

```
01-dates-utc-timezone-handling/
├── server.js           # Express app setup
├── routes.js           # API routes
├── controller.js       # Business logic
├── middleware.js       # Custom middleware
├── schema.js           # Validation schemas
├── package.json        # Dependencies
├── .env.example        # Environment template
├── setup.md            # This file
├── theory.md           # Learning material
├── README.md           # Module overview
└── App.jsx             # React testing UI
```

## Next Steps

1. Read `theory.md` for conceptual understanding
2. Review `server.js` to see implementation
3. Run `npm run dev` to start server
4. Open `http://localhost:3000` for testing UI
5. Test endpoints using provided React interface
