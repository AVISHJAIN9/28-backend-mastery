# Setup Guide - Module 23.4: Unicode Edge Cases

## Installation

```bash
cd 04-unicode-edge-cases
npm install
cp .env.example .env
```

## Environment Variables

```env
HTTP_PORT=5405
NODE_ENV=development
NORMALIZE_UNICODE=true
NORMALIZE_FORM=NFC
```

## How to Run

```bash
npm run dev
```

## How to Test

```bash
curl "http://localhost:5405/api/unicode/length?text=hello%20emoji%20test"
```
