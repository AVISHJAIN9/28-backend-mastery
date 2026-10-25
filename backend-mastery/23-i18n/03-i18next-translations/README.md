# Module 23.4: i18next Complete Translation Files

## Quick Start

```bash
npm install
npm start  # Starts server on port 5404
npm run dev  # For development with nodemon
```

Visit `http://localhost:5404/api/translations/en` to test.

## What is this?

This module extends the i18next knowledge with:

- **Complete Translation Catalogs**: Full localization for 12+ languages
- **Multiple Namespaces**: Separate translation files by domain
- **RTL Languages**: Arabic, Hebrew support with proper text direction
- **Gender-Aware Translations**: Handle gendered languages (Spanish, French, German)
- **Context-Specific Strings**: Same word, different translations based on context
- **Lazy Loading**: Load translations on-demand for performance
- **Format Strings**: Currency, dates, numbers in each locale

## Why does it matter?

Scaling translations from 3 languages to 50+ requires proper architecture:

- **Netflix**: Supports 30+ languages via centralized translation system
- **Airbnb**: 60+ language support with context-aware strings
- **Slack**: Automated RTL layout for Arabic, Hebrew, Persian users
- **Google Translate**: Powers millions of translations daily

## Translation Structure

```
locales/
├── en/
│   ├── common.json      # UI strings (welcome, buttons, etc)
│   ├── errors.json      # Error messages
│   ├── forms.json       # Form labels and validation
│   ├── messages.json    # User messages
│   ├── buttons.json     # Button text
│   └── notifications.json
├── es/
│   ├── common.json      # Spanish translations
│   └── ...
├── ar/
│   ├── common.json      # Arabic (RTL)
│   └── ...
└── ja/
    ├── common.json      # Japanese
    └── ...
```

## Key Features

### 1. Namespace Organization

```javascript
// common.json
{ "welcome": "Welcome to our app" }

// errors.json
{ "notFound": "Page not found" }

// forms.json
{ "submit": "Submit Form" }

// Usage
i18next.t('common:welcome')
i18next.t('errors:notFound')
i18next.t('forms:submit')
```

### 2. Language Support

**Western Languages:**
- English (en)
- Spanish (es)
- French (fr)
- German (de)
- Italian (it)
- Portuguese (pt)
- Russian (ru)
- Polish (pl)

**Asian Languages:**
- Chinese Simplified (zh)
- Japanese (ja)
- Korean (ko)

**RTL Languages:**
- Arabic (ar) - Right-to-left script

### 3. Gendered Nouns

For languages with grammatical gender:

```javascript
// German: masculine/feminine/neuter articles
{
  "articles": {
    "m": "der",
    "f": "die",
    "n": "das"
  }
}

// Spanish: adjective agreement
{
  "welcome_m": "Bienvenido",
  "welcome_f": "Bienvenida"
}
```

### 4. RTL Support

Arabic uses right-to-left text direction:

```javascript
// Detect RTL language
const isRTL = ['ar', 'he', 'fa', 'ur'].includes(language);

// Apply to DOM
if (isRTL) {
  document.dir = 'rtl';
  document.documentElement.lang = 'ar';
}
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Server status |
| GET | `/api/languages` | List supported languages |
| GET | `/api/translations/:lang` | Get all translations for language |
| GET | `/api/catalog` | Get complete translation catalog |
| POST | `/api/add-translation` | Add new translation (admin) |

## Common Patterns

### Pattern 1: Fallback Language Chain

```javascript
// If translation missing in German, fall back to English
{
  fallbackLng: ['de', 'en'],
  // 'de' is primary, 'en' is fallback
}
```

### Pattern 2: Namespace Loading

```javascript
// Only load needed namespaces for performance
i18next.loadNamespace('forms').then(() => {
  // forms translations ready
});
```

### Pattern 3: Context-Based Strings

```javascript
// Different translation based on context
{
  "bank": {
    "financial": "banco (financial institution)",
    "river": "orilla (river bank)"
  }
}

i18next.t('bank', { context: 'financial' })  // banco
i18next.t('bank', { context: 'river' })      // orilla
```

## Setup & Testing

1. Install dependencies: `npm install`
2. Start server: `npm run dev`
3. Test API: `curl http://localhost:5404/api/translations/en`
4. Browse translations in locales/ directory
5. Add new languages by creating language-specific subdirectories

Slack has 30+ languages. Each language is 500+ keys across 20+ namespaces. Without proper structure, this becomes unmaintainable chaos.

## How it works (step by step)

### Step 1: Create Translation Files

```json
// locales/en/translation.json
{
  "greeting": "Hello",
  "welcome": "Welcome to our app",
  "auth": {
    "login": "Log In",
    "register": "Sign Up"
  }
}

// locales/es/translation.json
{
  "greeting": "Hola",
  "welcome": "Bienvenido a nuestra app",
  "auth": {
    "login": "Iniciar Sesión",
    "register": "Registrarse"
  }
}
```

### Step 2: Initialize i18next

```javascript
import i18next from 'i18next';

await i18next.init({
  lng: 'en',
  resources: {
    en: { translation: require('./locales/en/translation.json') },
    es: { translation: require('./locales/es/translation.json') }
  }
});
```

### Step 3: Use It

```javascript
// Simple
i18n.t('greeting');  // "Hello" (if language is English)

// With variables
i18n.t('welcome', { name: 'John' });  // "Welcome, John"

// Change language
i18n.changeLanguage('es');  // Switch to Spanish
i18n.t('greeting');  // "Hola"
```

## Key concepts

### 1. **Translation Keys (Dot Notation)**

```javascript
// Keep strings organized by feature
{
  "auth": {
    "login": "Log In",
    "register": "Sign Up",
    "email": "Email"
  }
}

// Access as: auth.login
i18n.t('auth.login');  // "Log In"
```

### 2. **Pluralization**

```json
{
  "items": "You have {{count}} item",
  "items_plural": "You have {{count}} items"
}
```

```javascript
i18n.t('items', { count: 1 });  // "You have 1 item"
i18n.t('items', { count: 5 });  // "You have 5 items"
```

### 3. **Interpolation**

```json
{
  "greeting": "Hello {{name}}",
  "emailSent": "Verification email sent to {{email}}"
}
```

```javascript
i18n.t('greeting', { name: 'Alice' });  // "Hello Alice"
i18n.t('emailSent', { email: 'alice@example.com' });  // "Verification email sent to alice@example.com"
```

### 4. **Namespaces** (Pro Feature)

Instead of one file with 1000 keys, split by feature:

```
locales/en/
  auth.json        (50 keys)
  checkout.json    (60 keys)
  profile.json     (40 keys)
  common.json      (20 keys)
```

Load only what you need:

```javascript
const { t } = useTranslation('auth');  // Only load auth strings
```

Benefit: Smaller file sizes, better performance.

### 5. **Language Detection**

```javascript
// Auto-detect from browser
const detector = require('i18next-browser-languagedetector');

i18n.use(detector).init({
  fallbackLng: 'en'
  // Checks: URL param, localStorage, browser language
});

// Or manually
i18n.changeLanguage('es');
localStorage.setItem('language', 'es');  // Remember preference
```

## Common mistakes

### ❌ Mistake 1: Hardcoding Strings

```javascript
// WRONG
res.json({ message: 'Welcome ' + name });

// RIGHT
res.json({ message: i18n.t('greeting', { name }) });
```

**Fix:** Every user-facing string must come from translation files.

### ❌ Mistake 2: Assuming All Languages Have 2-Letter Codes

```javascript
// WRONG - Portuguese code is 'pt', not 'pt-pt'
i18n.changeLanguage('pt-pt');

// RIGHT - Use proper language codes
i18n.changeLanguage('pt');
i18n.changeLanguage('pt-BR');  // If you need variants
```

**Fix:** Use ISO 639-1 codes (en, es, fr, de, ja, ar).

### ❌ Mistake 3: Not Handling RTL Languages

Arabic, Hebrew, Urdu need special CSS:

```javascript
const dir = i18n.dir(i18n.language);
document.documentElement.dir = dir;  // "ltr" or "rtl"

// Also update CSS for text alignment
// Direction: rtl  means paragraphs align right instead of left
```

**Fix:** Check language direction and apply CSS.

### ❌ Mistake 4: Translation Files Out of Sync

```
en/translation.json has 50 keys
es/translation.json has only 40 keys
App crashes in Spanish for missing keys!
```

**Fix:** Validate completeness before shipping.

```javascript
const validateCompleteness = (languages) => {
  const enKeys = Object.keys(translations.en).sort();
  languages.forEach(lang => {
    const langKeys = Object.keys(translations[lang]).sort();
    if (JSON.stringify(enKeys) !== JSON.stringify(langKeys)) {
      console.warn(`${lang} is missing keys:`, enKeys.filter(k => !langKeys.includes(k)));
    }
  });
};
```

### ❌ Mistake 5: Using Machine Translation

```javascript
// WRONG - Google Translate of API keys
// "webhook_url" → "URL del gancho web" (literal, confusing)
// "database_replica" → "réplica de base de datos" (not standard)
```

**Fix:** Use professional translators for key terms, especially technical ones.

## Real world usage

### Use Case 1: React Component with Language Switcher

```javascript
import { useTranslation } from 'react-i18next';

export function App() {
  const { i18n, t } = useTranslation();
  
  return (
    <div>
      <h1>{t('welcome')}</h1>
      
      <select value={i18n.language} onChange={e => i18n.changeLanguage(e.target.value)}>
        <option value="en">English</option>
        <option value="es">Español</option>
        <option value="fr">Français</option>
      </select>
    </div>
  );
}
```

### Use Case 2: Express Backend

```javascript
app.get('/api/message/:lang', (req, res) => {
  i18n.changeLanguage(req.params.lang);
  res.json({
    greeting: i18n.t('greeting'),
    welcome: i18n.t('welcome')
  });
});
```

### Use Case 3: Email Templates

```javascript
async function sendWelcomeEmail(userLanguage, userEmail) {
  i18n.changeLanguage(userLanguage);
  
  const subject = i18n.t('email.welcome.subject');
  const body = i18n.t('email.welcome.body', { email: userEmail });
  
  await emailService.send({
    to: userEmail,
    subject,
    body
  });
}
```

### Use Case 4: Error Messages

```javascript
try {
  // operation
} catch (err) {
  const errorMessage = i18n.t(`errors.${err.code}`, {
    field: err.field
  });
  res.status(400).json({ error: errorMessage });
}
```

## API Reference

### GET /api/translate
Translate a single key.
```
?language=es&key=greeting
-> { result: "Hola" }
```

### GET /api/translate/multiple
Translate multiple keys at once.
```
?language=es&keys=greeting,login,welcome
-> { translations: { greeting: "Hola", ... } }
```

### GET /api/translate/interpolate
Translate with variables.
```
?language=es&key=emailSent&email=user@test.com
-> { result: "Email enviado a user@test.com" }
```

### GET /api/languages
List all supported languages.

### GET /api/namespaces
Show available translation namespaces.

### GET /api/translation-file/:language
Get complete translation file for a language.

### POST /api/translate/batch
Batch translate multiple requests.

```javascript
fetch('/api/translate/batch', {
  method: 'POST',
  body: JSON.stringify({
    requests: [
      { language: 'en', key: 'greeting' },
      { language: 'es', key: 'login', data: { count: 2 } }
    ]
  })
})
```

## Recommended Libraries

- **i18next**: Core translation library
- **react-i18next**: React bindings
- **i18next-browser-languagedetector**: Auto language detection
- **i18next-http-backend**: Load translations from server
- **crowdin**: Translation management platform
- **Lokalise**: Professional translation service

## Implementation Checklist

- [ ] Install i18next: `npm install i18next react-i18next`
- [ ] Create translation files (start with English)
- [ ] Initialize i18next in main app
- [ ] Add language switcher UI
- [ ] Extract all hardcoded strings to i18n
- [ ] Test with 3+ languages
- [ ] Handle RTL languages (if needed)
- [ ] Validate all languages have same keys
- [ ] Set up translation management service
- [ ] Performance: Lazy load namespaces

## Key Takeaway

With i18next, expanding to a new language is no longer code work — it's just adding a translation file.

When you release to Japan, you don't deploy new code. You add locales/ja/translation.json and that's it.

That's what professional global software looks like.

## Next Module

→ Module 23.4: Unicode Edge Cases & Character Set Issues
