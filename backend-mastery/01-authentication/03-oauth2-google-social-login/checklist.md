# OAuth 2.0 Implementation Checklist

## Google Cloud Setup
- [ ] Create Google Cloud project
- [ ] Create OAuth 2.0 credentials
- [ ] Add authorized redirect URIs
- [ ] Copy Client ID and Secret

## Backend Implementation
- [ ] Install dependencies (express, axios, jsonwebtoken, cors)
- [ ] Configure environment variables
- [ ] Implement /auth/google/url endpoint
- [ ] Implement /auth/google/callback endpoint
- [ ] Implement state parameter generation and verification
- [ ] Implement authorization code exchange
- [ ] Implement ID token verification
- [ ] Implement user creation/lookup
- [ ] Implement JWT token generation
- [ ] Implement /auth/me endpoint
- [x] Implement /auth/logout endpoint
- [ ] Implement provider linking logic
- [ ] Add rate limiting to callback endpoint
- [ ] Add CORS configuration
- [ ] Test all endpoints

## Frontend Implementation
- [ ] Create login button with Google redirect
- [ ] Handle OAuth callback
- [ ] Extract tokens from callback
- [ ] Store tokens in localStorage
- [ ] Implement authenticated requests
- [ ] Display user profile
- [ ] Implement logout
- [ ] Add error handling
- [ ] Test login flow

## Security Checklist
- [ ] Validate state parameter (CSRF protection)
- [ ] Use HTTPS in production
- [ ] Keep client secret server-side
- [ ] Verify ID token signature
- [ ] Use strong state tokens
- [ ] Rate limit callback endpoint
- [ ] Validate redirect URIs match
- [ ] Handle errors gracefully
- [ ] Don't log sensitive information
- [ ] Implement proper error boundaries

## Testing
- [ ] Test successful login flow
- [ ] Test account creation
- [ ] Test existing user login
- [ ] Test token exchange
- [ ] Test CSRF protection (state mismatch)
- [ ] Test logout
- [ ] Test provider linking
- [ ] Test API with valid token
- [ ] Test API with invalid token
- [ ] Test rate limiting

- [ ] Written middleware
- [ ] Tested manually
- [ ] Written tests
- [ ] Reviewed edge cases
