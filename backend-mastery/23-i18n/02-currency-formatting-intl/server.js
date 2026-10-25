const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const winston = require('winston');

const app = express();
const HTTP_PORT = process.env.HTTP_PORT || 5402;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// ============= MOCK CURRENCY DATA =============

const CURRENCIES = {
  'USD': { name: 'US Dollar', decimals: 2, symbol: '$' },
  'EUR': { name: 'Euro', decimals: 2, symbol: '€' },
  'GBP': { name: 'British Pound', decimals: 2, symbol: '£' },
  'JPY': { name: 'Japanese Yen', decimals: 0, symbol: '¥' },
  'CHF': { name: 'Swiss Franc', decimals: 2, symbol: 'Fr' },
  'CAD': { name: 'Canadian Dollar', decimals: 2, symbol: '$' },
  'AUD': { name: 'Australian Dollar', decimals: 2, symbol: '$' },
  'NZD': { name: 'New Zealand Dollar', decimals: 2, symbol: '$' },
  'CNY': { name: 'Chinese Yuan', decimals: 2, symbol: '¥' },
  'INR': { name: 'Indian Rupee', decimals: 2, symbol: '₹' },
  'MXN': { name: 'Mexican Peso', decimals: 2, symbol: '$' },
  'SGD': { name: 'Singapore Dollar', decimals: 2, symbol: '$' },
  'HKD': { name: 'Hong Kong Dollar', decimals: 2, symbol: '$' },
  'BRL': { name: 'Brazilian Real', decimals: 2, symbol: 'R$' },
  'KRW': { name: 'South Korean Won', decimals: 0, symbol: '₩' },
  'TRY': { name: 'Turkish Lira', decimals: 2, symbol: '₺' },
  'SEK': { name: 'Swedish Krona', decimals: 2, symbol: 'kr' },
  'NOK': { name: 'Norwegian Krone', decimals: 2, symbol: 'kr' },
  'DKK': { name: 'Danish Krone', decimals: 2, symbol: 'kr' },
  'ZAR': { name: 'South African Rand', decimals: 2, symbol: 'R' },
  'VND': { name: 'Vietnamese Dong', decimals: 0, symbol: '₫' },
  'AED': { name: 'UAE Dirham', decimals: 2, symbol: 'د.إ' },
  'KWD': { name: 'Kuwaiti Dinar', decimals: 3, symbol: 'د.ك' },
  'BHD': { name: 'Bahraini Dinar', decimals: 3, symbol: '.د.ب' },
  'TND': { name: 'Tunisian Dinar', decimals: 3, symbol: 'د.ت' }
};

// Mock exchange rates (in production, fetch from API)
const EXCHANGE_RATES = {
  'USD': 1.00,
  'EUR': 0.92,
  'GBP': 0.73,
  'JPY': 112.50,
  'CHF': 0.88,
  'CAD': 1.36,
  'AUD': 1.53,
  'NZD': 1.63,
  'CNY': 7.20,
  'INR': 83.12,
  'MXN': 17.05,
  'SGD': 1.35,
  'HKD': 7.84,
  'BRL': 4.97,
  'KRW': 1319.50,
  'TRY': 32.45,
  'SEK': 10.50,
  'NOK': 10.72,
  'DKK': 6.88,
  'ZAR': 18.95,
  'VND': 24500.00,
  'AED': 3.67,
  'KWD': 0.305,
  'BHD': 0.376,
  'TND': 3.10
};

// ============= UTILITY FUNCTIONS =============

/**
 * Format amount in specific currency and locale
 */
function formatCurrency(cents, currency, locale, displayStyle = 'symbol') {
  if (!CURRENCIES[currency]) {
    throw new Error(`Invalid currency: ${currency}`);
  }

  try {
    const formatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      currencyDisplay: displayStyle
    });

    return formatter.format(cents / Math.pow(10, CURRENCIES[currency].decimals));
  } catch (error) {
    logger.error('Formatting error', { cents, currency, locale, error });
    throw error;
  }
}

/**
 * Convert money from one currency to another
 */
function convertCurrency(fromCents, fromCurrency, toCurrency) {
  if (!EXCHANGE_RATES[fromCurrency]) {
    throw new Error(`Invalid source currency: ${fromCurrency}`);
  }
  if (!EXCHANGE_RATES[toCurrency]) {
    throw new Error(`Invalid target currency: ${toCurrency}`);
  }

  if (fromCurrency === toCurrency) {
    return fromCents;
  }

  // Convert to USD first (base currency)
  const usdAmount = fromCents / EXCHANGE_RATES[fromCurrency];

  // Convert USD to target currency
  const targetAmount = usdAmount * EXCHANGE_RATES[toCurrency];

  // Round to target currency's decimal places
  const targetDecimals = CURRENCIES[toCurrency].decimals;
  const factor = Math.pow(10, targetDecimals);

  return Math.round(targetAmount * factor);
}

/**
 * Get decimals needed for currency
 */
function getDecimalPlaces(currency) {
  if (!CURRENCIES[currency]) {
    throw new Error(`Invalid currency: ${currency}`);
  }
  return CURRENCIES[currency].decimals;
}

/**
 * Validate amount (no floating point errors)
 */
function validateAmount(cents, currency) {
  if (!Number.isInteger(cents) || cents < 0) {
    throw new Error('Amount must be non-negative integer (in cents)');
  }
  if (!CURRENCIES[currency]) {
    throw new Error(`Invalid currency: ${currency}`);
  }
  return true;
}

// ============= API ENDPOINTS =============

/**
 * GET /api/format
 * Format amount in currency and locale
 * ?cents=10050&currency=USD&locale=en-US&display=symbol
 */
app.get('/api/format', (req, res) => {
  try {
    const { cents, currency, locale = 'en-US', display = 'symbol' } = req.query;

    if (!cents || isNaN(cents) || !currency) {
      return res.status(400).json({
        error: 'Missing required params: cents, currency'
      });
    }

    const intCents = parseInt(cents);
    validateAmount(intCents, currency);

    const formatted = formatCurrency(intCents, currency, locale, display);

    res.json({
      input: {
        cents: intCents,
        currency,
        locale,
        display
      },
      formatted,
      details: {
        decimalPlaces: getDecimalPlaces(currency),
        currencyName: CURRENCIES[currency].name,
        exchangeRate: EXCHANGE_RATES[currency]
      }
    });
  } catch (error) {
    logger.error('Error in /api/format', { error: error.message });
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/convert
 * Convert amount from one currency to another
 * ?amount=10050&from=USD&to=EUR&display=symbol
 */
app.get('/api/convert', (req, res) => {
  try {
    const { amount, from, to, locale = 'en-US', display = 'symbol' } = req.query;

    if (!amount || isNaN(amount) || !from || !to) {
      return res.status(400).json({
        error: 'Missing required params: amount, from, to'
      });
    }

    const intAmount = parseInt(amount);
    validateAmount(intAmount, from);
    validateAmount(0, to); // Just validate currency exists

    const converted = convertCurrency(intAmount, from, to);
    const rate = EXCHANGE_RATES[to] / EXCHANGE_RATES[from];

    const fromFormatted = formatCurrency(intAmount, from, locale, display);
    const toFormatted = formatCurrency(converted, to, locale, display);

    res.json({
      conversion: {
        from: {
          amount: intAmount,
          currency: from,
          formatted: fromFormatted
        },
        to: {
          amount: converted,
          currency: to,
          formatted: toFormatted
        },
        rate: rate.toFixed(6),
        rateDescription: `1 ${from} = ${rate.toFixed(6)} ${to}`
      },
      exchangeRates: {
        [from]: EXCHANGE_RATES[from],
        [to]: EXCHANGE_RATES[to]
      },
      note: 'Exchange rates are mock data. In production, use real-time API.'
    });
  } catch (error) {
    logger.error('Error in /api/convert', { error: error.message });
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/compare
 * Show same amount in multiple currencies
 * ?amount=100&baseCurrency=USD&currencies=EUR,GBP,JPY
 */
app.get('/api/compare', (req, res) => {
  try {
    const {
      amount,
      baseCurrency = 'USD',
      currencies = 'EUR,GBP,JPY,CNY,INR',
      locale = 'en-US',
      display = 'symbol'
    } = req.query;

    if (!amount || isNaN(amount)) {
      return res.status(400).json({ error: 'Missing required param: amount' });
    }

    const intAmount = parseInt(amount);
    validateAmount(intAmount, baseCurrency);

    const currencyList = currencies.split(',').map(c => c.trim());
    const comparisons = {};

    for (const currency of currencyList) {
      if (!CURRENCIES[currency]) continue;

      const converted = convertCurrency(intAmount, baseCurrency, currency);
      comparisons[currency] = {
        amount: converted,
        formatted: formatCurrency(converted, currency, locale, display),
        rate: (EXCHANGE_RATES[currency] / EXCHANGE_RATES[baseCurrency]).toFixed(6)
      };
    }

    res.json({
      baseAmount: {
        amount: intAmount,
        currency: baseCurrency,
        formatted: formatCurrency(intAmount, baseCurrency, locale, display)
      },
      comparisons,
      meta: {
        locale,
        displayStyle: display,
        totalCurrencies: Object.keys(comparisons).length
      }
    });
  } catch (error) {
    logger.error('Error in /api/compare', { error: error.message });
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/currencies
 * List all supported currencies with metadata
 */
app.get('/api/currencies', (req, res) => {
  const currencies = Object.entries(CURRENCIES).map(([code, data]) => ({
    code,
    name: data.name,
    symbol: data.symbol,
    decimals: data.decimals,
    exchangeRate: EXCHANGE_RATES[code]
  }));

  res.json({
    currencies: currencies.sort((a, b) => a.code.localeCompare(b.code)),
    total: currencies.length,
    baseUnit: 'USD'
  });
});

/**
 * POST /api/calculate
 * Perform arithmetic on money amounts
 * { operations: [ { type: 'add', cents: 5000 }, { type: 'subtract', cents: 1000 } ] }
 */
app.post('/api/calculate', (req, res) => {
  try {
    const { startAmount, currency, operations = [] } = req.body;

    if (!startAmount || !currency) {
      return res.status(400).json({
        error: 'Missing required params: startAmount, currency'
      });
    }

    validateAmount(startAmount, currency);

    let result = startAmount;
    const steps = [{
      operation: 'start',
      amount: startAmount,
      formatted: formatCurrency(startAmount, currency, 'en-US', 'symbol')
    }];

    for (const op of operations) {
      const { type, operand, factor } = op;

      try {
        if (type === 'add') {
          result = result + operand;
        } else if (type === 'subtract') {
          result = result - operand;
        } else if (type === 'multiply') {
          result = Math.round(result * factor);
        } else if (type === 'divide') {
          result = Math.round(result / factor);
        } else {
          throw new Error(`Unknown operation: ${type}`);
        }

        steps.push({
          operation: type,
          operand: operand || factor,
          amount: result,
          formatted: formatCurrency(result, currency, 'en-US', 'symbol')
        });
      } catch (error) {
        throw new Error(`Operation ${type} failed: ${error.message}`);
      }
    }

    res.json({
      currency,
      steps,
      final: {
        amount: result,
        formatted: formatCurrency(result, currency, 'en-US', 'symbol')
      }
    });
  } catch (error) {
    logger.error('Error in /api/calculate', { error: error.message });
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/locales
 * Get formatting examples for different locales
 * ?amount=10050&currency=USD
 */
app.get('/api/locales', (req, res) => {
  try {
    const { amount, currency = 'USD' } = req.query;

    if (!amount || isNaN(amount)) {
      return res.status(400).json({ error: 'Missing required param: amount' });
    }

    const intAmount = parseInt(amount);
    validateAmount(intAmount, currency);

    const locales = [
      'en-US', 'en-GB', 'en-AU',
      'de-DE', 'de-AT', 'de-CH',
      'fr-FR', 'fr-BE', 'fr-CA',
      'es-ES', 'es-MX',
      'it-IT',
      'ja-JP',
      'zh-CN', 'zh-TW',
      'pt-BR', 'pt-PT',
      'ru-RU',
      'ar-AE', 'ar-SA',
      'ko-KR',
      'th-TH'
    ];

    const examples = {};

    for (const locale of locales) {
      try {
        examples[locale] = {
          symbol: formatCurrency(intAmount, currency, locale, 'symbol'),
          code: formatCurrency(intAmount, currency, locale, 'code'),
          name: formatCurrency(intAmount, currency, locale, 'name')
        };
      } catch (error) {
        // Some locale/currency combos not supported
        examples[locale] = { error: 'Locale/currency combination not supported' };
      }
    }

    res.json({
      amount: intAmount,
      currency,
      examples,
      note: 'Same amount formatted differently per locale'
    });
  } catch (error) {
    logger.error('Error in /api/locales', { error: error.message });
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/health
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Module 23.2 - Currency Formatting',
    timestamp: Math.floor(Date.now() / 1000)
  });
});

// Start server
app.listen(HTTP_PORT, () => {
  console.log(`✅ Module 23.2 server running on port ${HTTP_PORT}`);
  console.log(`📚 Test endpoints:`);
  console.log(`   GET  /api/format?cents=10050&currency=USD&locale=en-US&display=symbol`);
  console.log(`   GET  /api/convert?amount=10050&from=USD&to=EUR`);
  console.log(`   GET  /api/compare?amount=100&baseCurrency=USD&currencies=EUR,GBP,JPY`);
  console.log(`   GET  /api/currencies`);
  console.log(`   GET  /api/locales?amount=10050&currency=USD`);
  console.log(`   POST /api/calculate (body: {startAmount, currency, operations})`);
  console.log(`   GET  /api/health`);
});

module.exports = app;
