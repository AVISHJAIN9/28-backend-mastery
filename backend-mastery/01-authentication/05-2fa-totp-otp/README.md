# 2FA with TOTP/OTP

## What is this?
Two-Factor Authentication using Time-based One-Time Passwords (TOTP) or SMS/Email OTP. Additional layer beyond password authentication.

## Why does it matter?
- Prevents unauthorized access even if password is compromised
- Industry standard for security (banks, email services)
- Easy to implement with libraries like Speakeasy
- User can scan QR code with authenticator app
- Backup codes provide account recovery

## How it works
1. User registers and enables 2FA
2. Server generates TOTP secret
3. User scans QR code into authenticator app (Google Auth, Authy, etc.)
4. On login, user enters password + TOTP code from app
5. Server verifies TOTP code
6. User gains access
7. User gets backup codes for account recovery

## Key concepts
- **TOTP**: Time-based OTP using HMAC-SHA1
- **OTP**: One-Time Password, single-use code
- **Authenticator**: Mobile app generating codes
- **Backup Codes**: Single-use recovery codes
- **Window**: Time window for code acceptance
- **Secret**: Shared between server and authenticator

## Common mistakes

## Real world usage
