# Setup Guide - OAuth/OIDC Controller

## Installation

```bash
npm install express passport passport-oauth2 dotenv
```

## OAuth Provider Setup

1. Register your app with OAuth provider (Google, GitHub, etc)
2. Get Client ID and Client Secret
3. Set redirect URI

## Environment Variables

```env
CLIENT_ID=your-client-id
CLIENT_SECRET=your-client-secret
REDIRECT_URI=http://localhost:5029/auth/callback
OAUTH_PROVIDER=google
```

## Running

```bash
npm start
```

## Testing

```bash
# Login
curl http://localhost:5029/auth/login

# Callback (handled by provider)
curl http://localhost:5029/auth/callback?code=...
```
