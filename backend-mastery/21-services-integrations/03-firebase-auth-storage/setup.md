# Firebase Setup Guide

## Prerequisites
- Firebase project created at https://console.firebase.google.com
- Node.js 18.x or higher
- npm or yarn

## Step 1: Install Firebase Admin SDK

```bash
npm install
```

## Step 2: Get Firebase Credentials

1. Go to Firebase Console > Project Settings > Service Accounts
2. Click "Generate New Private Key"
3. Save the JSON file as `serviceAccountKey.json`
4. **Add to `.gitignore`**

## Step 3: Create .env File

```bash
cp .env.example .env
```

```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email
JWT_SECRET=your-super-secret-key
HTTP_PORT=6303
```

## Step 4: Enable Firestore Database

- Firebase Console > Build > Firestore Database
- Create Database in production mode

## Step 5: Enable Cloud Storage

- Firebase Console > Build > Storage
- Create bucket with default location

## Step 6: Enable Authentication

- Firebase Console > Build > Authentication
- Enable Email/Password provider

## How to run

```bash
npm install
node server.js
# Server runs on http://localhost:6303
```

## How to test

```bash
# Register user
curl -X POST http://localhost:6303/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","password":"password123"}'

# Login
curl -X POST http://localhost:6303/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","password":"password123"}'
```

## Verification Checklist

- [ ] serviceAccountKey.json in root
- [ ] .env file populated
- [ ] Firestore database created
- [ ] Cloud Storage bucket created
- [ ] Authentication enabled
- [ ] Server starts without errors
- [ ] Can register and login users
