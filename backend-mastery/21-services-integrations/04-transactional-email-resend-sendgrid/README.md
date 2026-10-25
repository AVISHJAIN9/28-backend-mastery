# Transactional Email - Resend & SendGrid

## What is this?

This module provides email delivery via two providers (Resend and SendGrid), supporting:
- **Transactional Emails**: Order confirmations, password resets, notifications
- **Verification Emails**: Email confirmation with OTP codes
- **Receipt Emails**: Order receipts with itemized details
- **Batch Emails**: Send same email to multiple recipients
- **Email Templates**: Reusable templates with variable substitution

## Why does it matter?

Email is critical for user onboarding, password recovery, and business notifications. Using a service provider ensures high deliverability rates, handles bounces/complaints, and provides analytics. Dual providers enable failover and cost optimization.

## How it works (step by step)

1. **Route Selection**: Middleware randomly selects Resend or SendGrid
2. **Email Sending**: POST `/api/send` validates email and queues for delivery
3. **Rate Limiting**: Max 5 emails per minute per recipient prevents abuse
4. **Verification Flow**: POST `/api/send/verification` generates 6-digit code, expires in 1 hour
5. **Code Verification**: POST `/api/verify` validates code before marking email verified
6. **Receipt Generation**: Renders template with order details, sends via provider
7. **Batch Sending**: Sends same email to multiple recipients, tracks per-user status

## Key concepts

- **Service Provider Abstraction**: Same API works with Resend or SendGrid
- **Email Verification**: OTP expires, max 3 verify attempts
- **Rate Limiting**: Sliding window prevents spam, 60-second cooldown
- **Email Logging**: All sent emails tracked with delivery status
- **Template System**: Reusable templates with variable injection
- **HTML/Text**: Support both plain text and HTML rendering

## Common mistakes

1. **No rate limiting** → Attackers spam verification emails → Implement cooldown
2. **OTP never expires** → Use exact timestamps for expiration validation
3. **Verification code guessable** → Use cryptographic random, 6-8digit codes
4. **Silent failures** → Always log exceptions with error codes
5. **Plaintext passwords in email** → Use temporary links with tokens instead
6. **Not validating email format** → Joi email() validator catches typos

## Real world usage

**SaaS Onboarding**: User registers → verification email → click link → enabled account
**E-commerce**: User purchases → receipt email with order summary → shipping confirmation → delivery notification
**Password Reset**: User requests reset → unique token email → click link → set new password
**API Notifications**: System processes event → triggers transactional email → user receives update

## API Endpoints

### Basic Sending
- `POST /api/send` - Send email to single recipient
- `POST /api/send/batch` - Send same email to multiple recipients

### Verification
- `POST /api/send/verification` - Send verification email with OTP
- `POST /api/verify` - Verify OTP code

### Receipts & Templates
- `POST /api/send/receipt` - Send order receipt email
- `POST /api/templates` - Create reusable template
- `GET /api/templates` - List templates
- `GET /api/logs` - View sent email logs

## Quick Start

```bash
npm install
node server.js
# Running on http://localhost:6304
```

## Testing

```bash
# Send email
curl -X POST http://localhost:6304/api/send \
  -H "Content-Type: application/json" \
  -d '{
    "to":"user@example.com",
    "subject":"Welcome",
    "body":"Hello there!"
  }'

# Send verification email
curl -X POST http://localhost:6304/api/send/verification \
  -H "Content-Type: application/json" \
  -d '{
    "to":"user@example.com",
    "verificationCode":"123456"
  }'

# Verify code
curl -X POST http://localhost:6304/api/verify \
  -H "Content-Type: application/json" \
  -d '{"to":"user@example.com","code":"123456"}'
```
