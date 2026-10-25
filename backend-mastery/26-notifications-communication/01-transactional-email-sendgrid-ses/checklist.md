# Setup & Testing Checklist

## Pre-Setup
- [ ] Node.js 14+ installed (`node --version`)
- [ ] npm installed (`npm --version`)
- [ ] Terminal access in project directory

## Installation
- [ ] Run `npm install`
- [ ] Verify all dependencies installed (`npm list`)

## Configuration - Choose ONE Provider

### Option A: Local Testing (Nodemailer + MailDev)
- [ ] Install MailDev: `npm install -g maildev`
- [ ] Start MailDev: `maildev` (runs on port 1080)
- [ ] Copy `.env.example` to `.env`
- [ ] Set in `.env`:
  ```
  EMAIL_PROVIDER=nodemailer
  SMTP_HOST=localhost
  SMTP_PORT=1025
  FROM_EMAIL=noreply@app.local
  ```
- [ ] Verify MailDev is running: `curl http://localhost:1080`

### Option B: SendGrid
- [ ] Create SendGrid account at https://sendgrid.com/
- [ ] Create API key in SendGrid dashboard
- [ ] Verify sender email address in SendGrid
- [ ] Copy `.env.example` to `.env`
- [ ] Set in `.env`:
  ```
  EMAIL_PROVIDER=sendgrid
  SENDGRID_API_KEY=SG.xxxxxxxxxxxxx
  FROM_EMAIL=your_verified_email@domain.com
  ```

### Option C: AWS SES
- [ ] Create AWS account and set up IAM user
- [ ] Get Access Key ID and Secret Access Key
- [ ] Verify sender email in SES console
- [ ] Request production access (if in sandbox)
- [ ] Copy `.env.example` to `.env`
- [ ] Set in `.env`:
  ```
  EMAIL_PROVIDER=ses
  AWS_REGION=us-east-1
  AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
  AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
  FROM_EMAIL=your_verified_email@domain.com
  ```

## Server Setup
- [ ] Start development server: `npm run dev`
- [ ] Verify server is running: `curl http://localhost:4001/health`
- [ ] Expected response:
  ```json
  {
    "status": "ok",
    "port": 4001,
    "module": "01 Transactional Email"
  }
  ```

## Test 1: View Available Templates
```bash
curl http://localhost:4001/api/email/templates
```
- [ ] Response includes 4 templates (welcome, passwordReset, orderConfirmation, twoFactor)
- [ ] Each template has name, subject, body, category fields

## Test 2: Send Single Email
```bash
curl -X POST http://localhost:4001/api/email/send \
  -H "Content-Type: application/json" \
  -d '{
    "recipientEmail": "test@example.com",
    "subject": "Test Email",
    "body": "<h1>Hello!</h1><p>This is a test.</p>"
  }'
```
- [ ] Response has `status: 201`
- [ ] Response includes `auditId`
- [ ] If using MailDev, email appears in http://localhost:1080

## Test 3: Send Template Email
```bash
curl -X POST http://localhost:4001/api/email/template \
  -H "Content-Type: application/json" \
  -d '{
    "recipientEmail": "user@example.com",
    "template": "welcome",
    "templateVariables": {
      "userName": "John Smith",
      "appName": "MyAwesomeApp"
    }
  }'
```
- [ ] Response has `status: 201`
- [ ] Email received with variables replaced
- [ ] Subject contains "Welcome to MyAwesomeApp!"

## Test 4: Send Bulk Emails
```bash
curl -X POST http://localhost:4001/api/email/bulk \
  -H "Content-Type: application/json" \
  -d '{
    "emails": ["test1@example.com", "test2@example.com"],
    "template": "orderConfirmation",
    "templateVariables": {
      "orderId": "12345",
      "amount": "$99.99"
    }
  }'
```
- [ ] Response shows `sent: 2`
- [ ] Both emails received successfully
- [ ] Response has timestamp format (207 status for partial success)

## Test 5: View Audit Logs
```bash
curl http://localhost:4001/api/email/audits
```
- [ ] Response includes all emails sent
- [ ] Each log has: id, recipientEmail, subject, status, template, provider
- [ ] Status shows "sent" for successful sends

## Test 6: Filter Audit Logs
```bash
curl http://localhost:4001/api/email/audits?status=sent
curl http://localhost:4001/api/email/audits?template=welcome
```
- [ ] First request returns only "sent" emails
- [ ] Second request returns only "welcome" template emails
- [ ] Response includes correct total count

## Test 7: Get Specific Audit Log
```bash
curl http://localhost:4001/api/email/audit/1
```
- [ ] Response includes complete log entry for ID 1
- [ ] All fields present: id, recipientEmail, subject, status, sentAt, etc.

## Test 8: Email Validation
```bash
curl -X POST http://localhost:4001/api/email/send \
  -H "Content-Type: application/json" \
  -d '{
    "recipientEmail": "invalid-email",
    "subject": "Test",
    "body": "Test"
  }'
```
- [ ] Response status: 400
- [ ] Error message mentions invalid email format

## Test 9: Rate Limiting
```bash
# Send 11 emails rapidly
for i in {1..11}; do
  curl -X POST http://localhost:4001/api/email/send \
    -H "Content-Type: application/json" \
    -d "{\"recipientEmail\": \"test$i@example.com\", \"subject\": \"Test\", \"body\": \"Test\"}"
done
```
- [ ] First 10 succeed (status 201)
- [ ] 11th fails with 429 (Too Many Requests)
- [ ] Error message mentions rate limit

## Test 10: React UI Testing
- [ ] Open http://localhost:4001/ in browser
- [ ] UI loads successfully
- [ ] Try sending email via UI
- [ ] Verify response appears
- [ ] Test template dropdown
- [ ] View audit logs in UI

## Advanced Tests (Optional)

### Test A/B Variables
```bash
curl -X POST http://localhost:4001/api/email/template \
  -H "Content-Type: application/json" \
  -d '{
    "recipientEmail": "test@example.com",
    "template": "passwordReset",
    "templateVariables": {
      "resetLink": "https://app.com/reset?token=xyz"
    }
  }'
```
- [ ] Email includes custom reset link
- [ ] Link is properly formatted in HTML

### Test Metadata Tracking
```bash
curl -X POST http://localhost:4001/api/email/send \
  -H "Content-Type: application/json" \
  -d '{
    "recipientEmail": "test@example.com",
    "subject": "Test",
    "body": "Test",
    "metadata": {
      "userId": 123,
      "campaignId": "promo-2024",
      "version": "A"
    }
  }'
```
- [ ] Audit log includes metadata
- [ ] Can filter/track by campaign

### Test with Different Providers
- [ ] Change EMAIL_PROVIDER in .env
- [ ] Restart server
- [ ] Repeat Tests 1-5 with new provider
- [ ] Verify emails received via new provider

## Production Readiness Checklist
- [ ] Error handling tests passed
- [ ] Input validation tests passed
- [ ] Rate limiting tests passed
- [ ] All 10 basic tests passed
- [ ] Theory.md reviewed
- [ ] Environment variables properly configured
- [ ] Email provider credentials verified
- [ ] SPF/DKIM/DMARC configured for domain (if using real domain)
- [ ] Logging configured for monitoring
- [ ] Ready for Module 02 (Email Queuing)

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "ECONNREFUSED" on send | Start MailDev: `maildev` |
| "Invalid API key" | Check SENDGRID_API_KEY in .env |
| "Email address not verified" | Verify email in SendGrid/SES dashboard |
| "Port 4001 in use" | Change HTTP_PORT in .env or kill process on port 4001 |
| "Cannot find module" | Run `npm install` again |
| UI doesn't load | Check browser console for errors |
| Email goes to spam | Configure SPF/DKIM/DMARC records (see theory.md) |

## Notes
- All tests use example.com domains - replace with real emails if testing with real provider
- MailDev persists emails in memory - restart to clear
- Rate limiter resets every minute
- Audit logs persist in memory - restart server to clear

