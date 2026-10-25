# Setup Guide

## Prerequisites
- Node.js 16+
- npm or yarn
- Redis (if module uses caching)
- MongoDB (if module uses database)

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create environment file:
```bash
cp .env.example .env
```

3. Update .env with your configuration

## Local Development

```bash
npm run dev
```

Server will start with hot reload via nodemon.

## Production

```bash
npm start
```

## Testing

Run the React UI test application:
```bash
npm run test
```

Or test via API directly:
```bash
curl http://localhost:3000/health
```

## Troubleshooting

### Port Already in Use
```bash
lsof -ti:3000 | xargs kill -9
```

### Dependencies Issue
```bash
rm -rf node_modules package-lock.json
npm install
```

### Environment Variables
Ensure all required env vars are set in .env file.
