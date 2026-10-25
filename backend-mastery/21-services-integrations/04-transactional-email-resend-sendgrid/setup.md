# Transactional Email Setup Guide

## Prerequisites
- Resend account (https://resend.com) OR SendGrid account (https://sendgrid.com)
- Node.js 18.x or higher
- npm or yarn

## Step 1: Choose Email Provider

### Option A: Resend
1. Sign up at https://resend.com
2. Verify sender email
3. Get API key from Settings > API Keys
4. Copy to `RESEND_API_KEY`

### Option B: SendGrid
1. Sign up at https://sendgrid.com
2. Verify sender email
3. Get API key from Settings
4. Copy to `SENDGRID_API_KEY`

## Step 2: Install Dependencies

```bash
npm install
```

## Step 3: Create .env File

```bash
cp .env.example .env
```

```env
RESEND_API_KEY=re_xxxxxxxxxxxxx
SENDGRID_API_KEY=SG.xxxxxxxxxxxxx
FROM_EMAIL=noreply@yourdomain.com
JWT_SECRET=your-super-secret-key
HTTP_PORT=6304
```

## Step 4: Verify Sender Email

For production, use your company domain:
1. Add domain in provider dashboard
2. Add DNS records (SPF, DKIM)
3. Wait for verification

For testing:
- Resend: Use `delivered@resend.dev` for test emails
- SendGrid: Use sandbox mode

## Step 5: Run Development Server

```bash
node server.js
# Server runs on http://localhost:6304
```

## How to test

```bash
# Send email
curl -X POST http://localhost:6304/api/send \
  -H "Content-Type: application/json" \
  -d '{"to":"user@example.com","subject":"Test","body":"Hello"}'

# Send verification email
curl -X POST http://localhost:6304/api/send/verification \
  -H "Content-Type: application/json" \
  -d '{"to":"user@example.com","code":"123456"}'

# Verify OTP
curl -X POST http://localhost:6304/api/verify \
  -H "Content-Type: application/json" \
  -d '{"to":"user@example.com","code":"123456"}'
```

## Verification Checklist

- [ ] Email provider account created
- [ ] Sender email verified
- [ ] API key in .env
- [ ] npm install completed
- [ ] Server starts without errors
- [ ] Test email sends successfully
- [ ] Verification email receives code
- [ ] OTP expires after timeout
- [ ] Rate limiting blocks excessive sends
