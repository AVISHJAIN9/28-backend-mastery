# Module 23.3: i18next Translation API

## Quick Start

```bash
npm install
npm start  # Starts server on port 5403
npm run dev  # For development with nodemon
```

Visit `http://localhost:5403/api/languages` to test.

## What is this?

This module teaches you the i18next framework, the de facto standard for internationalization (i18n) in JavaScript projects.

- **i18next Library**: Framework-agnostic, supports namespaces, pluralization, interpolation
- **Namespaces**: Organize translations logically (common, errors, forms, etc.)
- **Pluralization**: Handle singular/plural forms in different languages
- **Interpolation**: Pass variables into translations at runtime
- **Language Detection**: Automatically detect user's preferred language
- **Backend Integration**: Server-side translation management

## Why does it matter?

i18next is used by millions of projects:

- React/Next.js applications
- Vue.js/Nuxt applications
- Angular applications
- Node.js backends
- Mobile apps via react-native-i18next

Without proper translation architecture, you end up with hardcoded strings scattered everywhere.

## How it works (step by step)

### Step 1: Initialize i18next

```javascript
import i18next from 'i18next';
import HttpBackend from 'i18next-http-backend';

i18next
  .use(HttpBackend)
  .init({
    fallbackLng: 'en',
    debug: true,
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json'
    }
  });
```

### Step 2: Create Translation Files

```json
// locales/en/common.json
{
  "welcome": "Welcome",
  "greeting": "Hello, {{name}}!",
  "items": {
    "one": "You have 1 item",
    "other": "You have {{count}} items"
  }
}

// locales/es/common.json
{
  "welcome": "Bienvenido",
  "greeting": "¡Hola, {{name}}!",
  "items": {
    "one": "Tienes 1 artículo",
    "other": "Tienes {{count}} artículos"
  }
}
```

### Step 3: Use Translations

```javascript
i18next.t('welcome')  // "Welcome"
i18next.t('greeting', { name: 'John' })  // "Hello, John!"
i18next.t('items', { count: 5 })  // "You have 5 items"
```

## Key Concepts

### Namespaces

Organize translations by domain:

```javascript
// Multiple namespaces per language
{
  'common.json': { welcome: '...' },
  'errors.json': { notFound: '...' },
  'forms.json': { submit: '...' }
}

// Use namespace when translating
i18next.t('common:welcome')
i18next.t('errors:notFound')
```

### Pluralization

Different languages have different plural rules:

```javascript
// English: 1 vs other
{ one: "1 item", other: "{{count}} items" }

// Russian: 1, 2-4, 5+
{ one: "...", few: "...", many: "...", other: "..." }

// French: 0-1 vs 2+
{ one: "...", other: "..." }

i18next.t('items', { count: 5 })
```

### Interpolation

Insert variables dynamically:

```javascript
{
  "greeting": "Hello, {{name}}!",
  "nested": "Welcome {{user.name}} from {{user.country}}"
}

i18next.t('greeting', { name: 'Alice' })
i18next.t('nested', { user: { name: 'Bob', country: 'USA' } })
```

## Common Mistakes

### ❌ Mistake 1: Hardcoded Strings

```javascript
// WRONG
res.json({ message: 'Welcome to our app' });

// CORRECT
res.json({ message: i18next.t('welcome') });
```

### ❌ Mistake 2: Missing Translations

```javascript
// What if translation key doesn't exist?
i18next.t('nonexistent')  // Returns key name: 'nonexistent'

// CORRECT: Use fallback key
i18next.t('missing', { defaultValue: 'Default text' })
```

### ❌ Mistake 3: String Concatenation

```javascript
// WRONG: Can't handle gender/pluralization rules
msg = greeting + ' ' + name + ', you have ' + count + ' messages'

// CORRECT: Use interpolation
i18next.t('greeting_with_messages', { name, count })
```

## Setup

1. See [setup.md](./setup.md) for installation
2. Copy `.env.example` to `.env` and adjust port
3. Run `npm install && npm run dev`
4. Test endpoints in the React UI

## Real-World Example

### E-commerce Platform

```javascript
// locales/en/products.json
{
  "productTitle": "{{name}}",
  "price": "${{amount}}",
  "inStock_one": "1 item in stock",
  "inStock_other": "{{count}} items in stock",
  "soldOut": "Out of stock"
}

// locales/es/products.json
{
  "productTitle": "{{name}}",
  "price": "$${{amount}}",
  "inStock_one": "1 artículo en stock",
  "inStock_other": "{{count}} artículos en stock",
  "soldOut": "Agotado"
}

// Backend API response
res.json({
  title: i18next.t('products:productTitle', { name: 'Laptop' }),
  price: i18next.t('products:price', { amount: 999.99 }),
  stock: i18next.t('products:inStock', { count: 42 })
});
```
