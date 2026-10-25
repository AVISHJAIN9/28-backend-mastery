# Setup Guide - Module 23.2: Currency Formatting & Intl API

## Prerequisites

- Node.js v16+ 
- npm or yarn
- Basic knowledge of JavaScript

## Installation

```bash
# Navigate to module directory
cd 02-currency-formatting-intl

# Install dependencies
npm install

# Copy environment template
cp .env.example .env
```

## Environment Variables

Create a `.env` file based on `.env.example`:

```env
# Server Configuration
HTTP_PORT=5402
NODE_ENV=development

# Currency Configuration
DEFAULT_CURRENCY=USD
SUPPORTED_CURRENCIES=USD,EUR,GBP,JPY,CNY,INR,CAD,AUD,CHF,SEK
```

## How to Run

### Development Mode (with auto-reload)

```bash
npm run dev
```

### Production Mode

```bash
npm start
```

## How to Test

```bash
curl http://localhost:5402/api/currencies
```
