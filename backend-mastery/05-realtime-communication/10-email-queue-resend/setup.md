# Email Queue - Resend - Setup Guide

## Installation
```bash
npm install resend
```

## Environment Variables
```env
RESEND_API_KEY=your_api_key
PORT=4000
```

## How to run
```bash
node server.js
```

## How to test
```bash
curl -X POST http://localhost:4000/api/send \
  -d '{"to":"user@example.com","subject":"Test","html":"<p>Hello</p>"}' \
  -H "Content-Type: application/json"
```