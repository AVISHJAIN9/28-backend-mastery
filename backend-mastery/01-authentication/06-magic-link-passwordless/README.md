# Magic Link Passwordless Authentication

## What is this?
Passwordless authentication via email. User receives unique link in email that logs them in directly without password.

## Why does it matter?
- Zero password management overhead
- No phishing vulnerability with passwords
- Seamless user experience
- Works across all devices
- Mobile app friendly
- Reduces support burden

## How it works
1. User enters email address
2. System generates secure token
3. Email sent with unique magic link
4. User clicks link in email
5. Token verified server-side
6. User logged in automatically
7. Link expires after use

## Key concepts
- **Token**: Cryptographically secure random string
- **Expiration**: Links valid for limited time (15min typical)
- **Single Use**: Token consumed after verification
- **Email Verification**: Confirms user owns email
- **Link Binding**: Token bound to specific email

## Common mistakes

## Real world usage
