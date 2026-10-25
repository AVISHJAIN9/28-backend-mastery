# Setup Guide - OAuth 2.0 Google Social Login

## Prerequisites

- Node.js 14+
- Google Cloud Console account
- Postman or equivalent for testing

## 1. Google Cloud Setup

### Create Google OAuth 2.0 Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project or select existing
3. Navigate to "Credentials"
4. Click "Create Credentials" → "OAuth 2.0 Client ID"
5. Choose "Web application"
6. Add authorized redirect URIs:
   - `http://localhost:3000/auth/google/callback` (development)
   - `https://yourdomain.com/auth/google/callback` (production)

7. Copy Client ID and Client Secret

## 2. Backend Setup

### Install Dependencies

```bash
npm install express axios jsonwebtoken cors dotenv joi uuid
```

### Environment Setup

Create `.env`:

```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback
JWT_SECRET=your-secret-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-32-chars
FRONTEND_REDIRECT_URI=http://localhost:5173/auth/callback
NODE_ENV=development
PORT=3000
```

### Create server.js

```javascript
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes');

const app = express();

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

app.use('/auth', authRoutes);

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
```

### Run Backend

```bash
node server.js
```

## 3. Frontend Setup

### Create .env

```env
VITE_API_URL=http://localhost:3000
```

### Run React App

```bash
npm install react axios
npm run dev
```

## 4. Testing

### Test Login Flow

1. Start backend: `node server.js`
2. Start frontend: `npm run dev`
3. Click "Login with Google"
4. Grant permissions
5. Should redirect back with tokens
6. Should display user profile

### Using Curl

```bash
# Get auth URL
curl http://localhost:3000/auth/google/url

# After getting auth URL, open in browser and complete OAuth flow
# You'll be redirected to callback with tokens
```

## 5. Troubleshooting

### "Redirect URI mismatch"
- Check GOOGLE_REDIRECT_URI matches exactly in Google Console
- Make sure no trailing slashes mismatch

### "Invalid state"
- CSRF protection issue
- Clear browser localStorage and try again

### "Access Denied"
- User denied permissions
- Check requested scopes in code

### CORS Errors
- Ensure frontend and backend URLs match CORS config
- Check FRONTEND_REDIRECT_URI is correct

## Production Deployment

1. Update Google OAuth credentials for production domain
2. Use HTTPS everywhere
3. Store secrets in environment variables
4. Migrate to database for user storage
5. Implement rate limiting
6. Add request logging
7. Setup monitoring/alerts
8. Enable audit logging

## Environment Variables
## How to run
## How to test
