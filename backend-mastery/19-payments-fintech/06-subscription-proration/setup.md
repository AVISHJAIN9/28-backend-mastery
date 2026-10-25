# Module 06: Subscription Proration - Setup

## Dependencies
```bash
npm install
```

## Environment Variables
```bash
cp .env.example .env
```
Edit `.env`:
```
HTTP_PORT=6106
NODE_ENV=development
```

## How to run
```bash
npm start
```
Server: http://localhost:6106

## How to test

**Proration Formula:**
```
netAmount = (newDailyRate - oldDailyRate) × daysRemaining
```

**Create Subscription:**
```bash
curl -X POST http://localhost:6106/api/subscriptions \
  -H "Content-Type: application/json" \
  -d '{"customerId": "cust_123", "planId": "starter"}'
```

**Calculate Upgrade Proration:**
```bash
curl -X POST http://localhost:6106/api/subscriptions/sub_123/calculate-proration \
  -H "Content-Type: application/json" \
  -d '{"newPlanId": "professional"}'
```

**Plans:** Starter ($99), Professional ($199), Enterprise ($499)

**Using React UI:**
1. `npm start`
2. Open `preview.html`
3. Create subscription → Calculate proration on upgrade
4. See fair pro-rata charges
