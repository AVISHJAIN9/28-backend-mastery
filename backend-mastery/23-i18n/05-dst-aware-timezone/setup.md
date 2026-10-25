# Setup Guide - Module 23.5: DST-Aware Timezone

## Installation

```bash
cd 05-dst-aware-timezone
npm install
cp .env.example .env
```

## Environment Variables

```env
HTTP_PORT=5406
NODE_ENV=development
DST_AWARE=true
SUPPORTED_TIMEZONES=UTC,America/New_York,America/Los_Angeles,Europe/London
```

## How to Run

```bash
npm run dev
```

## How to Test

```bash
curl "http://localhost:5406/api/dst-check/2024-03-10/America/New_York"
```
