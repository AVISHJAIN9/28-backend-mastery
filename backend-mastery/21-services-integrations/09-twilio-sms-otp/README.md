# Twilio SMS & OTP

## What is this?

Twilio provides SMS capabilities for:
- **OTP Verification**: Two-factor authentication via SMS codes
- **SMS Messaging**: Send and receive SMS messages
- **Phone Number Validation**: Verify phone number format and carrier
- **Delivery Tracking**: Know when SMS delivered, read, or failed
- **Bulk Messaging**: Send thousands of SMS codes simultaneously
- **International Support**: SMS in 180+ countries

## Why does it matter?

SMS-based OTP is more secure than email (phone-verified) and has higher adoption than authenticator apps. Required for regulated industries (banking, healthcare). SMS 2FA reduces account takeovers by 99% compared to password-only authentication.

## How it works (step by step)

1. **Request OTP**: POST `/api/auth/request-otp` with phone number
2. **Validate Phone**: Check format, country supported, not blacklisted
3. **Generate Code**: Create 6-digit code, expire in 5 minutes
4. **Send SMS**: Twilio API sends SMS to phone number
5. **Track Delivery**: Webhook notifies server when SMS delivered
6. **User Enters Code**: PUT `/api/auth/verify-otp` with OTP
7. **Compare Codes**: Verify OTP matches and hasn't expired
8. **Mark Verified**: Create JWT token, set verified=true
9. **Rate Limiting**: Max 3 attempts per minute, lockout after 5 failed attempts

## Key concepts

- **OTP Expiration**: 5 minute window closes doors on brute force
- **Delivery Webhooks**: Twilio notifies server of delivery status
- **Phone Verification**: Validate before sending, catch typos
- **Rate Limiting**: Prevent OTP spam on same number
- **SMS Cost**: Track usage, alert on quota
- **Fallback Auth**: If OTP fails, use email verification
- **Geolocation**: Match received OTP location to registered user location

## Common mistakes

1. **No OTP expiration** → Attackers have unlimited time to guess → Set 5 minute TTL
2. **Predictable OTP codes** → Sequential codes easy to guess → Use cryptographic random
3. **No rate limiting** → 1000 SMS sent to same number as spam → Max 5 per hour
4. **SMS not encrypted** → Carrier might log unencrypted SMS → Add HTTPS layer
5. **No delivery tracking** → User never receives SMS, confused → Webhook notifies
6. **International numbers not supported** → Reject valid numbers → Validate country code

## Real world usage

**Banking App**: User logs in → requests SMS OTP → enters code → account unlocked
**Food Delivery**: New user registers → SMS verification → phone confirmed → can place orders
**Cryptocurrency Exchange**: Large withdrawal → OTP required → SMS sent → prevents unauthorized access
**Healthcare**: Patient accesses records → 2FA with SMS OTP → HIPAA compliant

## API Endpoints

### OTP
- `POST /api/auth/request-otp` - Send OTP to phone
- `POST /api/auth/verify-otp` - Verify OTP code
- `POST /api/auth/resend-otp` - Resend OTP after expiration

### SMS
- `POST /api/sms/send` - Send SMS message
- `GET /api/sms/logs` - View SMS delivery logs

### Phone Management
- `POST /api/phone/validate` - Validate phone number format
- `GET /api/phone/info` - Get phone carrier info

## Quick Start

```bash
npm install
node server.js
# Running on http://localhost:6309
```

## Testing

```bash
# Send OTP
curl -X POST http://localhost:6309/api/auth/request-otp \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"+15551234567"}'

# Verify OTP (check SMS for code)
curl -X POST http://localhost:6309/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"+15551234567","code":"123456"}'

# Send SMS
curl -X POST http://localhost:6309/api/sms/send \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"+15551234567","message":"Hello World"}'
```
