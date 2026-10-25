# OAuth 2.0 - Google Social Login

## What is this?

OAuth 2.0 is an open authorization standard that allows users to login to your application using their existing social media accounts (Google, GitHub, Facebook, etc.) without sharing their passwords directly with your app.

With Google login specifically:
- User clicks "Login with Google"
- User authenticates with Google (if not already logged in)
- Your app receives user info (name, email, picture) from Google
- Your app creates session/tokens for the user

## Why does it matter?

- **Reduced Friction**: Users don't need to create new accounts
- **Social Trust**: Users are more confident logging in with trusted providers
- **Better UX**: Faster signup/login process
- **Less Liability**: You don't store users' passwords directly
- **Increased Conversion**: Reduces signup abandonment
- **Social Data**: Access to user profile information
- **Account Linking**: Users can link multiple providers to one account

## How it works (step by step)

1. **User Initiates Login**: Clicks "Login with Google" button
2. **State Generation**: Generate random state to prevent CSRF attacks
3. **Redirect to Google**: Send user to Google's authorization endpoint with your app credentials
4. **User Consents**: User logs in to Google and grants permission to your app
5. **Redirect Back**: Google redirects back to your callback with auth code
6. **Verify State**: Verify the state matches (CSRF protection)
7. **Exchange Code**: Use authorization code to get ID token from Google
8. **Create/Update User**: Create user if new, or update last login
9. **Issue Tokens**: Generate JWT tokens for your app
10. **User Logged In**: User can now access protected resources

## Key concepts

- **OAuth 2.0**: Standard protocol for delegated authorization
- **Authorization Code Flow**: Secure method for obtaining tokens
- **State Parameter**: Prevents CSRF attacks in OAuth flow
- **ID Token**: Contains user information (JWT format from Google)
- **Access Code**: Temporary code exchanged for ID token
- **Scope**: Permissions requested (profile, email, etc.)
- **Account Linking**: Connecting multiple OAuth providers to one account
- **PKCE**: For public clients (mobile/SPA apps)

## Common mistakes

1. **Not verifying state**: CSRF vulnerability
2. **Storing credentials directly**: Defeats OAuth purpose
3. **Not using HTTPS**: Authorization codes can be intercepted
4. **Hardcoding client secret in frontend**: Always keep secrets server-side
5. **Not validating ID token signature**: Token could be forged
6. **Ignoring token expiry**: Refresh tokens properly
7. **Not handling errors**: Provide fallback authentication
8. **Requesting unnecessary scopes**: Privacy concerns
9. **Not handling linked accounts properly**: Prevent duplicate accounts
10. **Missing redirect URI validation**: Security risk

## Real world usage

- **Startup Authentication**: Most modern SaaS apps use social login
- **Enterprise Applications**: Using organization SSO (Google Workspace, etc.)
- **Mobile Apps**: Google Sign-In SDK widely used
- **Gaming**: Players login with Google account
- **SaaS Platforms**: Stripe, GitHub, Slack all support OAuth social login
- **Social Networks**: Cross-posting and account connection

## Implementation Details

### OAuth 2.0 Flow Diagram

```
1. User clicks "Login with Google"
2. Client redirects to: https://accounts.google.com/o/oauth2/v2/auth?
   - client_id=YOUR_CLIENT_ID
   - redirect_uri=YOUR_CALLBACK_URL
   - scope=openid profile email
   - state=RANDOM_STATE_TOKEN
   - response_type=code

3. User logs in and consents to your app
4. Google redirects to: YOUR_CALLBACK_URL?code=AUTH_CODE&state=STATE_TOKEN

5. Your backend exchanges code for token (server-to-server):
   POST https://oauth2.googleapis.com/token
   {
     code: AUTH_CODE,
     client_id: YOUR_CLIENT_ID,
     client_secret: YOUR_SECRET,
     redirect_uri: YOUR_CALLBACK_URL
   }

6. Google responds with ID token (JWT)
7. Decode and verify ID token
8. Create/update user in your database
9. Issue your own JWT tokens
10. Redirect user to app with tokens
```

## Security Best Practices

1. Always validate the state parameter
2. Use HTTPS only in production
3. Keep client secret secure (never expose in frontend)
4. Validate ID token signature
5. Use strong state tokens (cryptographically secure)
6. Implement proper error handling
7. Don't trust unverified tokens
8. Rate limit callback endpoint
9. Log OAuth events for audit trail
10. Regularly review connected apps for users

## Multi-Provider Account Linking

```
User logs in with Google -> Create account
Later, user wants to link GitHub -> Link to same account
User can now login with either Google or GitHub
Both map to same user account
```

## Troubleshooting

- **"Redirect URL mismatch"**: Ensure GOOGLE_REDIRECT_URI exactly matches Google Console settings
- **"Invalid state"**: CSRF protection - state mismatch between request and callback
- **"Access Denied"**: User denied permissions or provider blocked login
- **"Invalid credentials"**: Check client ID and secret are correct

