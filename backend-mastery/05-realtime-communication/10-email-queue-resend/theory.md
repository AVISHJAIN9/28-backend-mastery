# Email Queue - Resend Theory

## Email Delivery Flow

### Traditional (Blocking)
```
User signs up
   ↓
Send welcome email (5-10 sec)
   ↓
User waits for email
   ↓
Return response

Problem: Slow, user frustrated
```

### Queued (Non-Blocking)
```
User signs up
   ↓
Queue email job (instant)
   ↓
Return response immediately
   ↓
Background worker sends email
   ↓
User gets email within seconds

Benefit: Fast, responsive
```

## Email Provider: Resend

### What is Resend?
- Modern email API
- Easy to use
- Good deliverability
- Built for developers
- RESTful API

### Resend vs SendGrid vs AWS SES
```
Feature        | Resend | SendGrid | AWS SES
Price/1000     | $1     | $1       | $0.10
API Complexity | Simple | Complex  | Very complex
Deliverability | Good   | Excellent| Good
Support        | Good   | Excellent| Basic
```

## Email Queue Architecture

### Components
```
1. Email Template → 2. Job Creator → 3. Queue → 4. Worker → 5. Resend API
   (HTML/Text)        (add to queue)   (Redis)  (sends)    (delivers)
```

### Job Structure
```javascript
{
  id: 'email_123',
  type: 'welcome_email',
  template: 'welcome',
  to: 'user@example.com',
  data: {
    name: 'John',
    link: 'https://example.com/activate'
  },
  status: 'pending',
  createdAt: Date.now()
}
```

## Email Templates

### Simple Template
```html
<h1>Welcome {{name}}!</h1>
<p>Click <a href="{{link}}">here</a> to activate.</p>
```

### Template Engine (Handlebars)
```javascript
const template = fs.readFileSync('welcome.hbs', 'utf8');
const compiledTemplate = Handlebars.compile(template);

const html = compiledTemplate({
  name: 'John',
  link: 'https://example.com/verify?token=abc'
});
```

### Template Types
```
Transactional:
- Welcome
- Password reset
- Order confirmation
- Invoice

Marketing:
- Newsletter
- Promotion
- Event announcement

Notification:
- Alert
- Mention
- Activity update
```

## Sending Strategy

### Batching
```
Collect emails for 10 seconds
Batch send 100 emails at once
More efficient than 1-by-1
```

### Rate Limiting
```
Resend: 1000 emails/minute limit
Strategy: Space out sends
          Queue handles automatically
```

### Retry Logic
```
Attempt 1: Immediately
Attempt 2: Wait 1min (if failed)
Attempt 3: Wait 10min (if failed)
Attempt 4: Wait 1hour (if failed)
After 4: Move to failed queue
```

## Delivery Verification

### Bounce Handling
```
Hard Bounce: Email invalid, never retry
Soft Bounce: Temporary issue, retry

Examples:
Hard: user@invalid.com (invalid domain)
Soft: Mailbox full (retry later)
```

### Unsubscribe Links (Legal)
```html
<footer>
  <a href="https://example.com/unsubscribe?token={{token}}">
    Unsubscribe
  </a>
  <p>© 2024 Example Corp</p>
</footer>
```

MUST include for marketing emails (CAN-SPAM Act)

## Tracking

### Click Tracking
```
Original: <a href="https://example.com">Link</a>
Tracked:  <a href="https://email-tracking.com/click?id=123">Link</a>

User clicks → Tracked → Redirects to original
```

### Open Tracking
```
Add invisible pixel: <img src="https://tracking.com/open?id=123">
Pixel loaded = email opened
```

### Performance Tracking
```
Metrics:
- Delivery rate
- Open rate
- Click rate
- Bounce rate
- Unsubscribe rate
```

## Best Practices

✅ Always queue, never send directly
✅ Include unsubscribe link
✅ Use clear from name
✅ A/B test subject lines
✅ Implement retry logic
✅ Monitor bounce rates
✅ Track engagement
✅ Test before sending
✅ Include plain text version
✅ Respect user preferences
