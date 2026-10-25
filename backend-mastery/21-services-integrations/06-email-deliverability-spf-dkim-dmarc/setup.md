# Email Deliverability Setup Guide

## Prerequisites

- Custom domain with DNS access
- Email provider (SendGrid, Resend, AWS SES)
- Node.js 18.x or higher

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Create .env File

```bash
cp .env.example .env
```

```env
FROM_DOMAIN=yourdomain.com
FROM_EMAIL=noreply@yourdomain.com
DKIM_PRIVATE_KEY=your-private-key
HTTP_PORT=6306
```

## Step 3: Generate DKIM Keys

```bash
# Generate RSA key pair
openssl genrsa -out dkim_private.pem 2048
openssl rsa -in dkim_private.pem -pubout -out dkim_public.pem

# View keys for .env
cat dkim_private.pem
cat dkim_public.pem
```

## Step 4: Setup SPF Record

Add DNS TXT record:
```
v=spf1 include:sendgrid.net ~all
```

## Step 5: Setup DKIM Record

Add DNS TXT record named `default._domainkey`:
```
v=DKIM1; k=rsa; p=MIGfMA0BgQ...[public key]
```

## Step 6: Setup DMARC Policy

Add DNS TXT record named `_dmarc`:
```
v=DMARC1; p=quarantine; rua=mailto:reports@yourdomain.com
```

## Step 7: Run Development Server

```bash
node server.js
# Server runs on http://localhost:6306
```

## How to test

```bash
# Send test email
curl -X POST http://localhost:6306/api/send/transactional \
  -H "Content-Type: application/json" \
  -d '{"to":"user@example.com","subject":"Test","body":"Test"}'

# Validate DNS records
curl http://localhost:6306/api/validate/spf
curl http://localhost:6306/api/validate/dkim
```

## Verification Checklist

- [ ] Domain DNS access configured
- [ ] DKIM keys generated
- [ ] SPF record added to DNS
- [ ] DKIM record added to DNS  
- [ ] DMARC policy record added
- [ ] Server starts without errors
- [ ] Test emails send and validate
- [ ] DMARC reports being received
