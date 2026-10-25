# Push Notifications - Firebase FCM - Setup Guide

## Installation
```bash
npm install firebase-admin
```

## Environment Variables
```env
PORT=4000
GOOGLE_APPLICATION_CREDENTIALS=/path/to/serviceAccountKey.json
```

## How to run
```bash
node server.js
```

## Setup Firebase
1. Create Firebase project
2. Download service account key
3. Set GOOGLE_APPLICATION_CREDENTIALS

## How to test
```bash
# Send push notification
curl -X POST http://localhost:4000/api/push/send \
  -d '{"deviceToken":"FCM_TOKEN","notification":{"title":"Hello"}}' \
  -H "Content-Type: application/json"
```