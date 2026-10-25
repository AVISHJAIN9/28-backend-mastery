# Setup Guide - Push Notifications (FCM & Web Push)

## Prerequisites

- Node.js v14+ installed
- npm or yarn package manager
- A text editor or IDE (VS Code recommended)
- For Firebase: Google Cloud project (free tier available)
- For Web Push: VAPID keys (can generate locally)

## Step 1: Install Dependencies

```bash
cd 03-push-notifications-fcm-web-push
npm install
```

This installs:
- `express` - Web framework
- `jsonwebtoken` - JWT authentication
- `express-rate-limit` - Rate limiting middleware
- `firebase-admin` - Firebase Cloud Messaging (FCM) SDK
- `web-push` - Web Push API client
- `dotenv` - Environment variable management

## Step 2: Configure Environment Variables

Create `.env` file from `.env.example`:

```bash
cp .env.example .env
```

Edit `.env` with your settings:

```env
# Security
JWT_SECRET=your-secret-key-change-in-production
NODE_ENV=development
HTTP_PORT=4003

# Firebase Cloud Messaging (FCM)
# Get these from Firebase Console → Project Settings → Service Accounts
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your-client-id

# Web Push VAPID Keys
# Generate with: npx web-push generate-vapid-keys
VAPID_PUBLIC_KEY=your-public-key
VAPID_PRIVATE_KEY=your-private-key

# Notification Settings
NOTIFICATION_ICON=https://example.com/icon.png
NOTIFICATION_BADGE=https://example.com/badge.png

# Monitoring
LOG_LEVEL=info
MONITOR_DELIVERY_RATE=true
```

### Getting Firebase Credentials

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create or select a project
3. Click Settings ⚙️ → Service Accounts
4. Click "Generate New Private Key"
5. Copy credentials to `.env`

### Generating VAPID Keys for Web Push

```bash
npx web-push generate-vapid-keys
```

Output:
Public Key: your-public-key
Private Key: your-private-key

Copy both to `.env` file.

## Step 3: Verify Installation

Start the server:

```bash
npm run dev
```

Expected output:
```
🚀 Push Notifications server running on http://localhost:4003
✅ Health check available: http://localhost:4003/health
```

Test the health endpoint:

```bash
curl http://localhost:4003/health | jq
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-03-20T10:30:00Z",
  "port": 4003,
  "features": [
    "device-management",
    "fcm-support",
    "web-push-api",
    "batch-notifications",
    "delivery-tracking"
  ]
}
```

## Step 4: Running the Development Server

### Using npm

```bash
# Development mode with auto-reload
npm run dev

# Or production mode
npm start
```

### Accessing the Frontend

In a separate terminal:

```bash
npx serve -s . -l 3003
```

Then open http://localhost:3003 in your browser.

## Step 5: Testing the API

### 1. Generate Test JWT Token

In Node.js REPL:

```javascript
const jwt = require('jsonwebtoken');
const token = jwt.sign({ id: 1, email: 'test@example.com' }, 'your-secret-key');
console.log(`Bearer ${token}`);
```

### 2. Register Your First Device

```bash
curl -X POST http://localhost:4003/api/devices/register \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "fcm",
    "token": "cNf4pT7sL9mKx3bQ6vY2aZ8wH1jE5gR4tU0dP3oN6sL"
  }'
```

### 3. List Registered Devices

```bash
curl http://localhost:4003/api/devices \
  -H "Authorization: Bearer YOUR_TOKEN" | jq
```

### 4. Send a Test Notification

```bash
curl -X POST http://localhost:4003/api/notifications/send \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "device_1001",
    "title": "Test Notification",
    "body": "This is a test message"
  }'
```

### 5. View Notification History

```bash
curl "http://localhost:4003/api/notifications/logs" \
  -H "Authorization: Bearer YOUR_TOKEN" | jq
```

## Troubleshooting

### Port 4003 Already in Use

```bash
# Find process using port 4003
lsof -i :4003

# Kill the process
kill -9 <PID>

# Or change port in .env
HTTP_PORT=4004
```

### Firebase Authentication Failed

- Verify `.env` contains correct Firebase credentials
- Check Service Account JSON format in FIREBASE_PRIVATE_KEY
- Ensure project has Cloud Messaging enabled

### VAPID Keys Invalid

```bash
# Regenerate keys
rm -f VAPID_keys.json
npx web-push generate-vapid-keys > VAPID_keys.json
cat VAPID_keys.json  # Copy to .env
```

### JWT Token Issues

- Token must be in Authorization header: `Bearer <token>`
- Check token hasn't expired (default 24h)
- Regenerate using same JWT_SECRET as in `.env`

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| `ENOENT: no such file or directory` | Run `npm install` in module directory |
| `Error: Firebase initialization failed` | Check FIREBASE_PROJECT_ID in `.env` |
| `Cannot find module 'express'` | Run `npm install` |
| `Invalid token` | Regenerate JWT with correct JWT_SECRET |
| `Device not found` | Register device first via /api/devices/register |
| `Rate limit exceeded` | Wait or adjust limit in middleware.js |

## Next Steps

1. ✅ Verify server is running on port 4003
2. ✅ Test device registration endpoint
3. ✅ Register multiple devices
4. ✅ Send notifications to devices
5. ✅ View notification logs and stats
6. ✅ Test batch sending (up to 1000 devices)

## Production Checklist

- [ ] Replace in-memory storage with MongoDB/PostgreSQL
- [ ] Set secure JWT_SECRET (min 32 chars)
- [ ] Enable HTTPS for Web Push
- [ ] Configure CORS for production domain
- [ ] Set up monitoring/alerts for delivery rates
- [ ] Implement token refresh every 90 days
- [ ] Add database indexes on userId + token
- [ ] Configure graceful shutdown handling
- [ ] Set up error logging (Winston/Sentry)
- [ ] Test with real FCM credentials and tokens
