# Theory: Transactional Email Systems

## What is Transactional Email?

Transactional emails are event-triggered, automated messages sent to users in response to specific actions. Unlike marketing emails, they're critical for user operations and typically have high open rates.

**Examples:**
- Password reset links
- Order confirmations
- Welcome emails
- OTP codes
- Invoice notifications
- Account activation emails

---

## Email Service Providers (ESPs)

### SendGrid
- **Pros:** High reliability, advanced analytics, A/B testing, great templates
- **Cons:** Paid, requires API key management
- **Use Case:** Enterprise applications with complex email needs
- **Rate Limit:** ~100 emails/second

### Amazon SES
- **Pros:** Cost-effective, integrates with AWS, good for scale
- **Cons:** Sandboxed by default, stricter reputation scoring
- **Use Case:** AWS ecosystems, high-volume sending
- **Rate Limit:** ~14 emails/second (default)

### Nodemailer + SMTP
- **Pros:** Simple, free, full control, no vendor lock-in
- **Cons:** You manage deliverability, no analytics
- **Use Case:** Startups, internal apps, development
- **Rate Limit:** Depends on your SMTP server

---

## Email Architecture Patterns

### 1. Synchronous Sending (Don't Do This)
```javascript
// User waits for email to send before API returns
app.post('/password-reset', (req, res) => {
  const email = await sendEmail(user.email);  // Slow!
  res.json({ success: true });
});
```
**Problems:** Slow API responses, if email fails, user sees error, no retry mechanism

### 2. Fire-and-Forget (Better)
```javascript
app.post('/password-reset', async (req, res) => {
  // Return immediately
  res.json({ success: true, message: 'Check your email' });
  
  // Send email in background
  sendEmail(user.email).catch(err => {
    logger.error('Email failed:', err);
    // Implement retry logic here
  });
});
```
**Pros:** Fast API response
**Cons:** No way to know if email failed

### 3. Queue-Based (Best for Scale)
```javascript
app.post('/password-reset', async (req, res) => {
  // Add to job queue
  queue.add('send-email', {
    email: user.email,
    template: 'password-reset'
  });
  
  res.json({ success: true });
});

// Worker processes queue asynchronously
queue.process('send-email', async (job) => {
  await sendEmail(job.data);
});
```
**Pros:** Reliable, retries, scalable, auditable

---

## Email Validation & Authentication

### 1. SPF (Sender Policy Framework)
Verifies that mail comes from authorized servers
```
v=spf1 include:sendgrid.net ~all
```

### 2. DKIM (DomainKeys Identified Mail)
Digitally signs emails to prove authenticity
```
DKIM-Signature: v=1; a=rsa-sha256; c=relaxed/relaxed;
  d=example.com; s=selector1; bh=xxx; b=xxx
```

### 3. DMARC (Domain-based Message Authentication)
Policy for handling unauthenticated emails
```
v=DMARC1; p=quarantine; rua=mailto:admin@example.com
```

---

## Email Templates

### Templating Best Practices
1. **Use template variables:** `Hi {{username}}, your code is {{code}}`
2. **Keep templates simple:** Plain HTML without external resources
3. **Fallback text:** Provide text/plain version
4. **Responsive design:** Mobile-first, 600px width
5. **Avoid spam triggers:** No image-only emails, balance text/images

### Template Security
```javascript
// BAD: User input directly in template
const template = `Hi ${userInput}, your code is ${code}`;

// GOOD: Sanitize and escape
const template = sanitize(userInput);
const emailBody = escapeHtml(template);
```

---

## Deliverability & Bounce Handling

### Bounce Types
1. **Hard Bounce:** Email address invalid (permanent)
   - Remove from list permanently
   - Example: user@invalid-domain.com

2. **Soft Bounce:** Email rejected temporarily
   - Retry 3-5 times with exponential backoff
   - Example: Mailbox full, server temporarily down

3. **Complaint:** User marked as spam
   - Unsubscribe immediately
   - Don't retry

### Bounce Tracking
```javascript
const scheduleRetry = (auditId, attempt = 1) => {
  if (attempt > 5) return updateLog(auditId, 'bounced');
  
  const delay = Math.pow(2, attempt) * 60 * 1000; // Exponential backoff
  setTimeout(() => resendEmail(auditId), delay);
};
```

---

## Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| Emails go to spam | Missing SPF/DKIM | Configure authentication |
| "554 Message rejected" | Content triggers spam filters | Avoid caps, multiple !, URLs |
| Slow sending | Synchronous API | Switch to queue-based |
| Duplicate emails | No idempotency key | Add request ID tracking |
| Lost emails | Crashes without logging | Audit log every attempt |

---

## Rate Limiting & Quotas

### SendGrid
- Free tier: 100 emails/day
- Paid: Depends on plan
- Limit: 100 messages per second

### AWS SES
- Free tier: 62,000 emails/day from EC2
- Sandbox: Limited to approved recipients
- Standard quota: 14 emails/second

### Best Practice
```javascript
const rateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,  // 10 emails per minute per user
  message: 'Too many emails sent'
});
```

---

## Compliance & Privacy

### GDPR
- Get explicit consent before sending marketing
- Provide unsubscribe options
- Honor data deletion requests

### CAN-SPAM
- Include physical address in email
- Honor unsubscribe within 10 days
- Clear subject lines

### Implementation
```javascript
const canSendMarketingEmail = (user) => {
  return user.consentGiven && !user.unsubscribed;
};
```

---

## Production Checklist

- ✅ Implement audit logging for every email
- ✅ Set up SPF/DKIM/DMARC records
- ✅ Use queue system for reliability
- ✅ Handle bounces and complaints
- ✅ Validate email addresses before sending
- ✅ Rate limit to prevent abuse
- ✅ Monitor delivery rates and bounces
- ✅ Test with real email (not test@example.com)
- ✅ Set up monitoring/alerts for failures
- ✅ Document template variables and required fields

