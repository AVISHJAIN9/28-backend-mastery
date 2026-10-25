# Twilio SMS Setup Guide

## Prerequisites

- Twilio account (https://www.twilio.com/console)
- Phone number for testing
- Node.js 18.x or higher

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Create Twilio Account

1. Sign up at https://twilio.com
2. Verify phone number via SMS
3. Get started with SMS
4. Choose plan (free for testing)

## Step 3: Get Twilio Credentials

1. Go to Console > Account > API Keys
2. Copy:
   - Account SID
   - Auth Token
3. Go to Phone Numbers > Manage Numbers
4. Note your Twilio phone number (starts with +1)

## Step 4: Create .env File

```bash
cp .env.example .env
```

```env
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_OTP_EXPIRY=300
JWT_SECRET=your-super-secret-key
HTTP_PORT=6309
```

## Step 5: Setup Webhook (Optional)

For delivery tracking:
1. Go to Messaging > Services
2. Set Fallback URL: `https://yourdomain.com/webhook/sms-status`
3. Events: Sent, Delivered, Failed

## Step 6: Configure Rate Limiting

```javascript
const otpLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5 // max 5 OTP requests per minute
});
```

## Step 7: Run Development Server

```bash
node server.js
# Server runs on http://localhost:6309
```

## How to test

```bash
# Send OTP
curl -X POST http://localhost:6309/api/auth/request-otp \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"+15551234567"}'

# Check SMS for code, then verify
curl -X POST http://localhost:6309/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"+15551234567","code":"123456"}'

# Send SMS
curl -X POST http://localhost:6309/api/sms/send \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"+15551234567","message":"Hello"}'

# Get SMS logs
curl http://localhost:6309/api/sms/logs
```

## Verification Checklist

- [ ] Twilio account created
- [ ] Phone number verified
- [ ] Account SID in .env
- [ ] Auth Token in .env
- [ ] Twilio phone number in .env
- [ ] Server starts without errors
- [ ] OTP sends to phone
- [ ] SMS SMS can be verified
- [ ] Rate limiting prevents spam
- [ ] Delivery status tracking works
