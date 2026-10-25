# Module 03: Double Entry Bookkeeping - Setup

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
HTTP_PORT=6103
NODE_ENV=development
```

## How to run
```bash
npm start
```
Server: http://localhost:6103

## How to test

**Golden Rule:** Every debit must have a credit

**Create Balanced Entry:**
```bash
curl -X POST http://localhost:6103/api/journal-entries \
  -H "Content-Type: application/json" \
  -d '{
    "entries": [
      {"account": "Cash", "debit": 1000, "credit": 0},
      {"account": "Revenue", "debit": 0, "credit": 1000}
    ]
  }'
```

**Using React UI:**
1. `npm start`
2. Open `preview.html`
3. Add entries → UI shows Balanced/Unbalanced
4. Submit when balanced ✓
