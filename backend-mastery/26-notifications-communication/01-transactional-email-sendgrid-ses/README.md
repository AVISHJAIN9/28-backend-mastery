# Module 01: Transactional Email (SendGrid/SES/Nodemailer)

## Overview

This module demonstrates how to send transactional emails using multiple providers:
- **SendGrid** - Enterprise-grade email service
- **AWS SES** - Cost-effective, AWS-native solution
- **Nodemailer** - Free, SMTP-based solution

Key features:
- Single & bulk email sending
- Pre-built email templates
- Email audit logging
- Email delivery tracking
- Retry mechanism for failed emails
- Rate limiting to prevent abuse

---

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
```

Edit `.env` with your email provider credentials:

**For Nodemailer (Local Testing):**
```env
EMAIL_PROVIDER=nodemailer
SMTP_HOST=localhost
SMTP_PORT=1025
FROM_EMAIL=noreply@app.local
```

**For SendGrid:**
```env
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=your_sendgrid_api_key
FROM_EMAIL=your_verified_email@domain.com
```

**For AWS SES:**
```env
EMAIL_PROVIDER=ses
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
FROM_EMAIL=your_verified_email@domain.com
```

### 3. (Optional) Start Local Mail Server
For testing without real email provider:
```bash
npm install -g maildev
maildev
# Runs on http://localhost:1080
```

### 4. Start Server
```bash
npm run dev
```

Server runs on `http://localhost:4001`

---

## API Endpoints

### Send Single Email
```bash
POST /api/email/send
Content-Type: application/json

{
  "recipientEmail": "user@example.com",
  "subject": "Your Password Reset",
  "body": "<h1>Click <a href='...'>here</a> to reset</h1>",
  "metadata": { "userId": 123 }
}
```

### Send from Template
```bash
POST /api/email/template
Content-Type: application/json

{
  "recipientEmail": "user@example.com",
  "template": "welcome",
  "templateVariables": {
    "userName": "John",
    "appName": "MyApp"
  }
}
```

### Send Bulk Emails
```bash
POST /api/email/bulk
Content-Type: application/json

{
  "emails": ["user1@example.com", "user2@example.com"],
  "subject": "System Announcement",
  "body": "<p>Important update...</p>"
}
```

### Get Available Templates
```bash
GET /api/email/templates
```

Response:
```json
{
  "templates": [
    {
      "key": "welcome",
      "name": "Welcome Email",
      "subject": "Welcome to {{appName}}!",
      "body": "Hi {{userName}}, welcome!",
      "category": "transactional"
    }
  ]
}
```

### Get Email Audit Logs
```bash
GET /api/email/audits
GET /api/email/audits?status=sent
GET /api/email/audits?template=welcome
GET /api/email/audit/1
```

### Resend Failed Email
```bash
POST /api/email/resend/1
```

### Get Available Providers
```bash
GET /api/email/providers
```

---

## Available Email Templates

1. **welcome** - Welcome/onboarding email
2. **passwordReset** - Password reset with link
3. **orderConfirmation** - Order confirmation with details
4. **twoFactor** - 2FA code delivery

---

## Architecture

### File Structure
```
├── server.js           # Express server setup
├── routes.js          # API route definitions
├── controller.js      # Email sending logic
├── middleware.js      # Auth, validation, rate limiting
├── schema.js          # Email templates & data models
├── App.jsx            # React testing UI
├── theory.md          # Deep dive concepts
├── checklist.md       # Setup & testing checklist
└── .env.example       # Environment variables template
```

### Data Flow
```
User Request
    ↓
validateEmailInput (middleware)
    ↓
emailRateLimiter (middleware)
    ↓  
sendTransactionalEmail (controller)
    ↓
createEmailAuditLog (schema)
    ↓
transporter.sendMail (nodemailer)
    ↓
updateAuditLog (success/failure)
    ↓
Response to user
```

---

## Testing

### Via React Frontend
```bash
npm run dev
# Open http://localhost:4001
# Use the React UI to test all endpoints
```

### Via cURL
```bash
# Test single email
curl -X POST http://localhost:4001/api/email/send \
  -H "Content-Type: application/json" \
  -d '{
    "recipientEmail": "test@example.com",
    "subject": "Test",
    "body": "<p>Test email</p>"
  }'

# Test template email
curl -X POST http://localhost:4001/api/email/template \
  -H "Content-Type: application/json" \
  -d '{
    "recipientEmail": "test@example.com",
    "template": "welcome",
    "templateVariables": { "userName": "Test", "appName": "MyApp" }
  }'

# View audit logs
curl http://localhost:4001/api/email/audits

# View templates
curl http://localhost:4001/api/email/templates
```

---

## Configuration Details

### Email Providers Comparison

| Feature | SendGrid | AWS SES | Nodemailer |
|---------|----------|---------|-----------|
| Setup Difficulty | Easy | Medium | Easy |
| Cost | $$ | $ | Free |
| Analytics | ✅ Advanced | ✅ Basic | ❌ |
| Webhooks | ✅ | ✅ | ❌ |
| Rate Limit | 100/sec | 14/sec | Unlimited |
| Best For | Enterprise | AWS Stack | Development |

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `EMAIL_PROVIDER` | sendgrid, ses, or nodemailer | No (default: nodemailer) |
| `SENDGRID_API_KEY` | Your SendGrid API key | If using SendGrid |
| `AWS_REGION` | AWS region | If using SES |
| `AWS_ACCESS_KEY_ID` | AWS access key | If using SES |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key | If using SES |
| `SMTP_HOST` | SMTP server hostname | If using Nodemailer |
| `SMTP_PORT` | SMTP port (usually 587 or 25) | If using Nodemailer |
| `SMTP_USER` | SMTP username | Optional |
| `SMTP_PASSWORD` | SMTP password | If auth required |
| `FROM_EMAIL` | Sender email address | Yes |
| `JWT_SECRET` | Secret for JWT tokens | No (default: test-secret-key) |
| `FRONTEND_URL` | Frontend URL for CORS | No (default: http://localhost:3000) |
| `HTTP_PORT` | Server port | No (default: 4001) |

---

## Common Issues & Solutions

### Email goes to spam
**Solution:** Configure SPF, DKIM, DMARC records on your domain. See theory.md for details.

### "ECONNREFUSED" error
**Solution:** Ensure email provider is configured. For Nodemailer, install maildev: `npm install -g maildev && maildev`

### Rate limit exceeded
**Solution:** Reduce email frequency or increase `LIMIT` in middleware.js

### Duplicate emails
**Solution:** Implement idempotency using request IDs. Track in audit log.

---

## Next Steps

1. ✅ Complete Module 01 (this module)
2. ➜ Module 02: Email Queuing & Retry (Redis/Bull)
3. ➜ Module 03: Push Notifications (FCM)
4. ➜ Module 04: SMS/OTP (Twilio)
5. ➜ Module 05: In-App Notifications (WebSocket)
6. ➜ Module 06: Notification Preferences
7. ➜ Module 07: Digest & Batching
8. ➜ Module 08: WhatsApp Business API
9. ➜ Module 09: Email Deliverability (SPF/DKIM)

---

## Resources

- [SendGrid Documentation](https://sendgrid.com/docs/)
- [AWS SES Documentation](https://docs.aws.amazon.com/ses/)
- [Nodemailer Documentation](https://nodemailer.com/)
- [Email Authentication Best Practices](https://dmarcian.com/)

---

## File Reference

- **theory.md** - Deep dive into email systems, providers, deliverability
- **checklist.md** - Step-by-step setup and testing checklist
- **App.jsx** - Interactive React UI for testing all endpoints

