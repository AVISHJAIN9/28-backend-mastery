# Module 23.2: Currency Formatting & Intl API

## Quick Start

```bash
npm install
npm start  # Starts server on port 5402
npm run dev  # For development with nodemon
```

Visit http://localhost:5402/api/currencies to test.

## What is this?

This module teaches you how to format and convert currencies properly. It covers:

- **Intl.NumberFormat API**: Locale-aware currency formatting
- **ISO 4217 Currency Codes**: USD, EUR, JPY, etc.
- **Money Arithmetic**: Using integer cents, never floats
- **Exchange Rates**: Converting between currencies safely
- **Decimal Precision**: Different currencies have different decimal places
- **Real-World Failures**: Floating point bugs, hardcoded rates, wrong decimals

## Why does it matter?

Currency bugs can be catastrophic:

- **Stripe** returned fractional cents due to floating point math
- **Amazon** showed different prices in different regions
- **Groupon** displayed wrong decimal places for non-USD currencies
- **Banking systems** miscalculated billions in fees
- **0.1 + 0.2 ≠ 0.3** in JavaScript!

## How it works (step by step)

### Step 1: Store Money as Integer Cents

```javascript
// CORRECT: Integer (100 dollars 50 cents = 10050 cents)
const balance = 10050;  // cents
const currency = 'USD';

// WRONG: Floating point
const wrongBalance = 100.50;  // NEVER do this!
```

### Step 2: Format for Display Using Intl.NumberFormat

```javascript
const formatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD'
});

formatter.format(10050 / 100);  // "$100.50"
```

### Step 3: Handle Different Locales Automatically

```javascript
// Same amount, different locales
const de = new Intl.NumberFormat('de-DE', { 
  style: 'currency', 
  currency: 'EUR' 
});
de.format(100.50);  // "100,50 €" (comma as decimal!)

const fr = new Intl.NumberFormat('fr-FR', { 
  style: 'currency', 
  currency: 'EUR' 
});
fr.format(100.50);  // "100,50 €" (space for thousands)
```

### Step 4: Convert Between Currencies

```javascript
const usd = 10050;  // $100.50 in cents
const rate = 0.92;  // 1 USD = 0.92 EUR

const eur = Math.round(usd * rate);  // 9246 cents = €92.46
```

## Key concepts

### 1. **Decimal Places Vary by Currency**

```javascript
USD (2): $100.00
JPY (0): ¥100
BHD (3): ب.د100.000  // Bahraini Dinar
```

### 2. **Symbol Position Differs**

```javascript
$100.00   // US English
100,00€   // German
100.50$   // French (Canada)
¥100      // Japanese (no decimals)
```

### 3. **Thousands Separator Varies**

```javascript
1,234.56   // US English (comma)
1.234,56   // German (period)
1 234,56   // French (space)
1234,56    // Some countries (none)
```

### 4. **Integer Arithmetic Only**

```javascript
// CORRECT
let cents = 10050;
cents = cents + 5000;    // 15050
cents = cents - 1000;    // 14050
cents = Math.round(cents * 1.1);  // 15455

// WRONG
let dollars = 100.50;
dollars = dollars + 50;  // 150.50 (but might be 150.5000001)
```

## Common mistakes

### ❌ Mistake 1: Floating Point for Money
```javascript
let balance = 100.00;
balance -= 0.01;  // Repeated 100 times
console.log(balance);  // 99.99932734... ☠️
```

**Fix:** Use integer cents
```javascript
let cents = 10000;
cents -= 1;  // Repeated 100 times
console.log(cents);  // 9900 (exactly)
```

### ❌ Mistake 2: Hardcoded Symbols
```javascript
const formatted = `$${amount.toFixed(2)}`;
// Assumes US locale! Japanese users see ¥1,234.56 as "$1,234.56"
```

**Fix:** Use Intl.NumberFormat
```javascript
const formatter = new Intl.NumberFormat(locale, {
  style: 'currency',
  currency: currency
});
```

### ❌ Mistake 3: Hardcoded Exchange Rates
```javascript
const USD_TO_EUR = 0.92;  // Was true 1 year ago!
// Rates change every second
```

**Fix:** Fetch from API
```javascript
const rates = await fetch('https://api.example.com/rates').then(r => r.json());
```

### ❌ Mistake 4: Assuming All Currencies Have 2 Decimals
```javascript
const formatted = `${amount.toFixed(2)}`;
// JPY doesn't use decimals!
// BHD uses 3 decimals!
```

**Fix:** Use currency metadata
```javascript
const DECIMALS = { 'USD': 2, 'JPY': 0, 'BHD': 3 };
const places = DECIMALS[currency];
const formatted = `${amount.toFixed(places)}`;
// Better: use Intl.NumberFormat (automatic)
```

### ❌ Mistake 5: Storing as String
```javascript
db.balance = '$100.50';
// Can't do arithmetic!
// Parsing is error-prone
```

**Fix:** Store as number (cents) + currency code
```javascript
db.balanceCents = 10050;
db.currency = 'USD';
```

## Real world usage

### Use Case 1: Display Price in User's Locale

```javascript
function formatPrice(cents, currency, userLocale) {
  const formatter = new Intl.NumberFormat(userLocale, {
    style: 'currency',
    currency: currency,
    currencyDisplay: 'symbol'
  });
  
  return formatter.format(cents / 100);
}

formatPrice(9999, 'USD', 'en-US');  // "$99.99"
formatPrice(9999, 'USD', 'de-DE');  // "99,99 $"
formatPrice(9999, 'JPY', 'ja-JP');  // "\¥9,999"
```

### Use Case 2: Convert Price to Customer's Currency

```javascript
function convertPrice(dollarCents, targetCurrency, rates) {
  const rate = rates[targetCurrency];
  return Math.round(dollarCents * rate);
}

const rates = { 'EUR': 0.92, 'GBP': 0.73, 'JPY': 112.50 };
const eurCents = convertPrice(10050, 'EUR', rates);
console.log(eurCents);  // 9246 cents
```

### Use Case 3: Apply Discount Correctly

```javascript
function applyDiscount(cents, discountPercent) {
  // DON'T: const discount = cents * (discountPercent / 100);
  // DO: Round at the end
  const discount = Math.round((cents * discountPercent) / 100);
  return cents - discount;
}

const price = 10050;
const after30off = applyDiscount(price, 30);
console.log(after30off);  // 7035 (exactly $70.35)
```

### Use Case 4: Batch Currency Operations

```javascript
function summarizeOrder(items, userCurrency) {
  const subtotal = items.reduce((sum, item) => sum + item.priceCents, 0);
  const tax = Math.round(subtotal * 0.08);  // 8% tax
  const shipping = 1500;  // $15 flat
  const total = subtotal + tax + shipping;
  
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: userCurrency
  });
  
  return {
    subtotal: formatter.format(subtotal / 100),
    tax: formatter.format(tax / 100),
    shipping: formatter.format(shipping / 100),
    total: formatter.format(total / 100)
  };
}
```

## API Reference

### GET /api/format
Format amount in currency and locale.
```
?cents=10050&currency=USD&locale=en-US&display=symbol
```

### GET /api/convert
Convert amount between currencies.
```
?amount=10050&from=USD&to=EUR&locale=en-US
```

### GET /api/compare
Show same amount in multiple currencies.
```
?amount=100&baseCurrency=USD&currencies=EUR,GBP,JPY
```

### GET /api/currencies
List all supported currencies.

### GET /api/locales
Show formatting examples across different locales.

### POST /api/calculate
Perform arithmetic on money amounts.

## Recommended Libraries

- **Intl.NumberFormat**: Built-in, no library needed
- **dinero.js**: Money library with arithmetic
- **decimal.js**: Arbitrary precision numbers
- **currency.js**: Lightweight currency operations

## Next Module

→ Module 23.3: i18next Translation API

