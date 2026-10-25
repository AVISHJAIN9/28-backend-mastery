# Module 23.2: Currency Formatting & Intl API

## 📚 Table of Contents

1. [Why Currency is Hard](#why-currency-is-hard)
2. [The Intl.NumberFormat API](#the-intlnumberformat-api)
3. [Currency Codes (ISO 4217)](#currency-codes-iso-4217)
4. [Formatting Rules by Locale](#formatting-rules-by-locale)
5. [Currency Symbols vs Codes](#currency-symbols-vs-codes)
6. [Arithmetic with Money](#arithmetic-with-money)
7. [Real-World Failures](#real-world-failures)
8. [Best Practices](#best-practices)

---

## Why Currency is Hard

Currency formatting is deceptively complex:

### Problem 1: Different Symbols

```
$100.00 (US Dollar) - Symbol before number, period as decimal
100,00€ (Euro) - Symbol after number, comma as decimal
¥100 (Japanese Yen) - Symbol before, no decimals
₹100.00 (Indian Rupee) - Symbol before, comma as thousands separator
```

### Problem 2: Locale-Specific Rules

```javascript
// 1,234.56 USD (English, United States)
// 1.234,56 EUR (German, Germany)
// ১,২৩,৪৫.৬৭ BDT (Bengali, Bangladesh) - different numerals!
// 1 234,56 CHF (French, Switzerland) - space as thousands
```

### Problem 3: Significant Digits

```javascript
// USD: 2 decimal places (cent precision)
0.01

// VND (Vietnamese Dong): 0 decimal places (no subunit)
1

// TND (Tunisian Dinar): 3 decimal places
0.001

// BHD (Bahraini Dinar): 3 decimal places
0.001
```

### Problem 4: Rounding Errors

```javascript
// WRONG: JavaScript floating point
0.1 + 0.2 === 0.3  // false!
0.1 + 0.2          // 0.30000000000000004

// Store as integers (cents), not floats!
1 + 2 === 3  // true
```

### Problem 5: Currency Conversion Rates Change

Exchange rates fluctuate. Never hardcode them!

---

## The Intl.NumberFormat API

The `Intl.NumberFormat` API handles locale-specific number and currency formatting automatically.

### Basic Usage

```javascript
const formatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD'
});

formatter.format(1234.567);
// Output: "$1,234.57"
```

### Constructor Options

```javascript
new Intl.NumberFormat(locale, options)
```

**Locale**: Language-Region code
```javascript
'en-US'    // English, United States
'de-DE'    // German, Germany
'fr-FR'    // French, France
'ja-JP'    // Japanese, Japan
'zh-CN'    // Chinese, China
'pt-BR'    // Portuguese, Brazil
```

**Options**: Control formatting behavior

```javascript
{
  // Style: 'decimal', 'percent', 'currency', 'unit'
  style: 'currency',
  
  // Currency code (ISO 4217) - required when style is 'currency'
  currency: 'USD',
  
  // Minimum integer digits (default 1)
  minimumIntegerDigits: 1,
  
  // Significant digits (alternative to min/max fraction)
  minimumSignificantDigits: 1,
  maximumSignificantDigits: 21,
  
  // Fraction digits (decimal places)
  minimumFractionDigits: undefined,  // Auto-determined per currency
  maximumFractionDigits: undefined,  // Auto-determined per currency
  
  // Currency display: 'symbol', 'code', 'narrowSymbol', 'name'
  currencyDisplay: 'symbol',
  
  // Sign display: 'auto', 'always', 'exceptZero', 'never'
  signDisplay: 'auto',
  
  // Grouping: 'auto', 'always', 'min2', false
  useGrouping: 'auto',
  
  // Rounding: 'ceil', 'expand', 'floor', 'halfCeil', 'halfExpand', 'halfFloor', 'halfTrunc', 'trunc'
  roundingMode: 'halfExpand'
}
```

---

## Currency Codes (ISO 4217)

Every country has a 3-letter currency code defined by ISO 4217.

### Common Currencies

```javascript
const currencies = {
  'USD': 'US Dollar',           // $ (United States)
  'EUR': 'Euro',                // € (European Union)
  'GBP': 'British Pound',       // £ (United Kingdom)
  'JPY': 'Japanese Yen',        // ¥ (Japan)
  'CNY': 'Chinese Yuan',        // ¥ (China)
  'INR': 'Indian Rupee',        // ₹ (India)
  'CAD': 'Canadian Dollar',     // $ (Canada)
  'AUD': 'Australian Dollar',   // $ (Australia)
  'CHF': 'Swiss Franc',         // Fr (Switzerland)
  'SEK': 'Swedish Krona',       // kr (Sweden)
  'NZD': 'New Zealand Dollar',  // $ (New Zealand)
  'MXN': 'Mexican Peso',        // $ (Mexico)
  'SGD': 'Singapore Dollar',    // $ (Singapore)
  'HKD': 'Hong Kong Dollar',    // $ (Hong Kong)
  'NOK': 'Norwegian Krone',     // kr (Norway)
  'KRW': 'South Korean Won',    // ₩ (South Korea)
  'TRY': 'Turkish Lira',        // ₺ (Turkey)
  'RUB': 'Russian Ruble',       // ₽ (Russia)
  'BRL': 'Brazilian Real',      // R$ (Brazil)
  'VND': 'Vietnamese Dong',     // ₫ (Vietnam)
  'BHD': 'Bahraini Dinar',      // .د.ب (Bahrain)
  'ZAR': 'South African Rand',  // R (South Africa)
  'AED': 'UAE Dirham',          // د.إ (United Arab Emirates)
  'TND': 'Tunisian Dinar',      // د.ت (Tunisia)
  'KWD': 'Kuwaiti Dinar',       // د.ك (Kuwait)
};

// Always use 3-letter codes, never symbols!
```

### Decimal Places per Currency

```javascript
// 2 decimal places (most Western currencies)
USD: 2  // $100.00
EUR: 2  // €100,00
GBP: 2  // £100.00

// 0 decimal places (no coin subunit)
JPY: 0  // ¥100
KRW: 0  // ₩100
VND: 0  // ₫100

// 3 decimal places (rare)
BHD: 3  // .د.ب100.000
KWD: 3  // د.ك100.000
TND: 3  // د.ت100.000

// Intl.NumberFormat handles this automatically!
```

---

## Formatting Rules by Locale

### US Dollar in Different Locales

```javascript
const usd = new Intl.NumberFormat('en-US', { 
  style: 'currency', 
  currency: 'USD' 
});
usd.format(1234.56);
// en-US: "$1,234.56"

const usdDE = new Intl.NumberFormat('de-DE', { 
  style: 'currency', 
  currency: 'USD' 
});
usdDE.format(1234.56);
// de-DE: "1.234,56 $" (dot for thousands, comma for decimal!)
```

### Euro in Different Locales

```javascript
// French: symbol after, space before
const eurFR = new Intl.NumberFormat('fr-FR', { 
  style: 'currency', 
  currency: 'EUR' 
});
eurFR.format(1234.56);
// France: "1 234,56 €"

// German: symbol after, period for thousands
const eurDE = new Intl.NumberFormat('de-DE', { 
  style: 'currency', 
  currency: 'EUR' 
});
eurDE.format(1234.56);
// Germany: "1.234,56 €"

// Italian: symbol before, period for thousands
const eurIT = new Intl.NumberFormat('it-IT', { 
  style: 'currency', 
  currency: 'EUR' 
});
eurIT.format(1234.56);
// Italy: "€ 1.234,56"
```

### Right-to-Left Languages

```javascript
// Arabic uses different numerals!
const aedAR = new Intl.NumberFormat('ar-AE', { 
  style: 'currency', 
  currency: 'AED' 
});
aedAR.format(1234.56);
// Arabic (UAE): "١٬٢٣٤٫٥٦ د.إ" (Arabic numerals: ١٢٣٤)
```

---

## Currency Symbols vs Codes

### Option 1: Symbol (Default)

```javascript
const formatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  currencyDisplay: 'symbol'  // Default
});

formatter.format(100);
// "$100.00"
```

**Pros**: Compact, familiar  
**Cons**: Some symbols ambiguous ($, ¥), doesn't work well at scale

### Option 2: Currency Code

```javascript
const formatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  currencyDisplay: 'code'
});

formatter.format(100);
// "USD 100.00"
```

**Pros**: Unambiguous, international  
**Cons**: Longer, less pretty

### Option 3: Currency Name

```javascript
const formatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  currencyDisplay: 'name'
});

formatter.format(100);
// "100.00 US dollars"
```

**Pros**: Super clear  
**Cons**: Very long, not great for UI

### Option 4: Narrow Symbol (Best of Both)

```javascript
const formatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  currencyDisplay: 'narrowSymbol'
});

formatter.format(100);
// "$100.00" (same as symbol, but different for some currencies)
```

### Recommendation

```javascript
// For international apps: use code
// For regional apps: use symbol/narrowSymbol
// Provide user preference option:

const userPreference = 'symbol';  // or 'code'
const formatter = new Intl.NumberFormat(userLocale, {
  style: 'currency',
  currency: userCurrency,
  currencyDisplay: userPreference
});
```

---

## Arithmetic with Money

**NEVER** use floating point for money!

### ❌ Wrong: Floating Point

```javascript
let balance = 100.00;
balance -= 0.01;
balance -= 0.01;
balance -= 0.01;
// ...repeat 100 times
console.log(balance);  // 99.99932734... ☠️
```

### ✅ Correct: Integers (Cents)

```javascript
let balanceCents = 10000;  // $100.00
balanceCents -= 1;
balanceCents -= 1;
balanceCents -= 1;
// ...repeat 100 times
console.log(balanceCents);  // 9997 (exactly $99.97)

// Convert for display
const formatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD'
});

formatter.format(balanceCents / 100);
// "$99.97"
```

### Database Schema

```javascript
// WRONG: Floating point in database
const userBalance = {
  userId: 1,
  balance: 100.50  // DANGER!
};

// CORRECT: Integer cents in database
const userBalance = {
  userId: 1,
  balanceCents: 10050,  // Exactly 100 dollars 50 cents
  currency: 'USD'       // Which currency these cents represent
};

// Display
const balance = userBalance.balanceCents / 100;
const formatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: userBalance.currency
});
formatter.format(balance);
```

### Addition and Subtraction

```javascript
function addMoney(amountCents1, amountCents2) {
  return amountCents1 + amountCents2;
}

function subtractMoney(fromCents, subtractCents) {
  return fromCents - subtractCents;
}

function multiplyMoney(amountCents, factor) {
  return Math.round(amountCents * factor);
}

function divideMoney(amountCents, divisor) {
  return Math.round(amountCents / divisor);
}

// Examples
let cents = 10050;  // $100.50
cents = subtractMoney(cents, 100);    // -$1.00
cents = addMoney(cents, 2500);        // +$25.00
cents = multiplyMoney(cents, 1.1);    // ×1.1 (10% increase)
console.log(cents);  // 124095 (exactly $1,240.95)
```

---

## Real-World Failures

### Failure 1: Stripe's Rounding Bug

Stripe returned fractional cents due to floating point math:

```javascript
// BUGGY CODE
const discount = amount * discountPercentage / 100;
const finalAmount = amount - discount;
// If discount is 0.335, finalAmount has rounding error

// CORRECT
const discountCents = Math.round((amount * discountPercentage) / 100);
const finalAmountCents = amount - discountCents;
```

### Failure 2: Amazon Currency Conversion

Amazon showed different prices in different currencies due to not using standard exchange rates:

```javascript
// WRONG: Different conversion logic per region
const usdPrice = 100;
const eurPrice = usdPrice * 0.92;  // Regional rate
const gbpPrice = usdPrice * 0.73;  // Different rate

// CORRECT: Single source of truth
const rates = {
  'EUR': 0.92,
  'GBP': 0.73,
  'JPY': 112.50
};

const convertPrice = (usdAmount, targetCurrency) => {
  return Math.round(usdAmount * rates[targetCurrency] * 100) / 100;
};
```

### Failure 3: Groupon Decimal Place Bug

Groupon displayed prices with wrong decimal places for non-USD currencies:

```javascript
// BUGGY: Assumes all currencies have 2 decimals
const price = 100.50;
const formatted = `$${price.toFixed(2)}`;

// CORRECT: Use Intl.NumberFormat
const formatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: currency  // Handles decimals automatically
});
const formatted = formatter.format(price);
```

### Failure 4: Banking System Cascade

A payment system didn't account for:
- Different decimal places per currency
- Rounding modes in financial districts
- Time zones for end-of-day cutoffs
- Exchange rate timing

Result: Billions in miscalculated fees!

---

## Best Practices

### 1. Always Use Currency Code in Database

```javascript
const payment = {
  amount: 10050,           // Integer cents
  currency: 'USD',         // ISO 4217 code
  createdAt: 1711756800,   // Unix timestamp
  description: 'Product purchase'
};
```

### 2. Format for Display Only

```javascript
function formatPrice(cents, currency, locale) {
  const formatter = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency
  });
  
  return formatter.format(cents / 100);
}

// Usage
const display = formatPrice(10050, 'USD', 'en-US');
// "$100.50"

const germanDisplay = formatPrice(10050, 'USD', 'de-DE');
// "100,50 $"
```

### 3. Flexible Currency Display

```javascript
function formatCurrency(cents, currency, locale, display = 'symbol') {
  const formatter = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    currencyDisplay: display  // symbol, code, name, narrowSymbol
  });
  
  return formatter.format(cents / 100);
}

// User can choose display format
console.log(formatCurrency(10050, 'USD', 'en-US', 'symbol'));      // "$100.50"
console.log(formatCurrency(10050, 'USD', 'en-US', 'code'));        // "USD 100.50"
console.log(formatCurrency(10050, 'USD', 'en-US', 'name'));        // "100.50 US dollars"
console.log(formatCurrency(10050, 'USD', 'en-US', 'narrowSymbol'));// "$100.50"
```

### 4. Store User Currency Preference

```javascript
const user = {
  userId: 1,
  email: 'alice@example.com',
  locale: 'en-US',
  
  // Currency preference for their region
  preferredCurrency: 'USD',
  
  // Account balance in their currency (as cents)
  balanceCents: 50000  // $500.00
};
```

### 5. Multi-Currency Conversion

```javascript
const exchangeRates = {
  // Rates relative to USD (always fetch from external API)
  'EUR': 0.92,
  'GBP': 0.73,
  'JPY': 112.50,
  'CHF': 0.88,
  'CAD': 1.36
};

function convertCurrency(fromCents, fromCurrency, toCurrency, rates) {
  if (fromCurrency === toCurrency) return fromCents;
  
  const fromRate = rates[fromCurrency] || 1;
  const toRate = rates[toCurrency] || 1;
  
  // Convert to USD first, then to target
  const usdCents = Math.round(fromCents / fromRate);
  const toCents = Math.round(usdCents * toRate);
  
  return toCents;
}

// Example
const euros = convertCurrency(10050, 'USD', 'EUR', exchangeRates);
// EUR 9046 (approximately)
```

### 6. Format for Different Contexts

```javascript
function formatForUI(cents, currency, locale) {
  // Pretty, user-friendly
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    currencyDisplay: 'symbol'
  }).format(cents / 100);
}

function formatForAPI(cents, currency) {
  // Standardized for servers
  return {
    amount: (cents / 100).toFixed(2),
    currency: currency
  };
}

function formatForDatabase(cents, currency) {
  // Raw integers, no decimals
  return { amount: cents, currency };
}

// Usage
const cents = 10050;
const currency = 'USD';
const locale = 'en-US';

console.log(formatForUI(cents, currency, locale));
// "$100.50"

console.log(formatForAPI(cents, currency));
// { amount: "100.50", currency: "USD" }

console.log(formatForDatabase(cents, currency));
// { amount: 10050, currency: "USD" }
```

### 7. Handle Free Amounts

```javascript
function formatPrice(cents, currency, locale) {
  if (cents === 0) {
    return 'Free';
  }
  
  const formatter = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency
  });
  
  return formatter.format(cents / 100);
}

formatPrice(0, 'USD', 'en-US');      // "Free"
formatPrice(10050, 'USD', 'en-US');  // "$100.50"
```

---

## Summary

### Key Takeaways

1. **Always use integer cents**, never float for money
2. **Store currency code** with amount (USD, EUR, etc.)
3. **Use Intl.NumberFormat** for locale-aware formatting
4. **Different decimals**: USD = 2, JPY = 0, BHD = 3
5. **Exchange rates change**: Fetch from API, never hardcode
6. **Test with edge cases**: Zero, negative, large amounts, non-USD

### Dangerous Patterns

- ❌ Floating point arithmetic on money
- ❌ Hardcoded symbols (assumes US locale)
- ❌ Hardcoded exchange rates
- ❌ Assuming all currencies have 2 decimals
- ❌ Storing formatted strings in database

### Safe Patterns

- ✅ Integer cents in database
- ✅ Intl.NumberFormat for display
- ✅ ISO 4217 currency codes
- ✅ Real-time exchange rates from API
- ✅ Locale-aware formatting per user

---

## Useful Resources

- **ISO 4217**: Currency codes
- **CLDR**: Locale data (powers Intl API)
- **Stripe Docs**: Money handling best practices
- **MDN Intl.NumberFormat**: Official API docs
- **exchangerate-api.com**: Free exchange rate API
