# Theory: i18next Translation API

## What is i18n?

**i18n** (internationalization) is a technique for building software that supports multiple languages and locales. The "i18n" is numeronym: "i" + 18 letters + "n".

**l10n** (localization) is the adaptation to a specific language/region, including:
- Language translation
- Currency formatting
- Date/time formats
- Number formats
- RTL text (Arabic, Hebrew)
- Cultural differences

## Why i18next?

i18next is the most popular i18n framework for JavaScript/Node.js because:

1. **Framework-agnostic**: Works with React, Vue, Angular, Express, etc.
2. **Powerful features**: Namespaces, pluralization, interpolation, context
3. **Extensible**: Plugin system for backends, language detectors, etc.
4. **Well-maintained**: Used by millions of projects
5. **Performance**: Lazy loading, efficient caching

## Core Concepts

### 1. Keys and Namespaces

```javascript
// Simple key
i18n.t('hello')  // "Hello"

// Nested key
i18n.t('auth.login.title')  // "Login"

// Namespace-qualified
i18n.t('auth:login.title')  // "Login" from auth namespace
i18n.t('checkout:payment.title')  // "Payment" from checkout namespace
```

### 2. Interpolation

Insert dynamic values:

```json
{
  "welcome": "Welcome, {{name}}!",
  "priceTag": "Price: {{currency}}{{amount}}",
  "nested": "Hello {{user.firstName}} {{user.lastName}}"
}
```

```javascript
i18n.t('welcome', { name: 'Alice' })
// "Welcome, Alice!"

i18n.t('priceTag', { currency: '$', amount: 99.99 })
// "Price: $99.99"

i18n.t('nested', { 
  user: { firstName: 'Bob', lastName: 'Smith' } 
})
// "Hello Bob Smith"
```

### 3. Pluralization

Handle singular/plural forms per language:

```json
{
  "item_one": "You have 1 item",
  "item_other": "You have {{count}} items"
}
```

```javascript
i18n.t('item', { count: 1 })  // "You have 1 item"
i18n.t('item', { count: 5 })  // "You have 5 items"
```

Different languages have different plural rules:

```
English:  one, other (2 forms)
French:   one, other (2 forms)
German:   one, other (2 forms)
Russian:  one, few, many, other (4 forms)
Polish:   one, few, many, other (4 forms)
Arabic:   zero, one, two, few, many, other (6 forms!)
```

i18next handles this automatically based on language rules.

### 4. Context

Translate same key differently based on context:

```json
{
  "friend_m": "Mr. Johnson (male friend)",
  "friend_f": "Ms. Johnson (female friend)",
  "friend": "Friend (generic)"
}
```

```javascript
i18n.t('friend', { context: 'm' })  // "Mr. Johnson (male friend)"
i18n.t('friend', { context: 'f' })  // "Ms. Johnson (female friend)"
i18n.t('friend')                    // "Friend (generic)"
```

## Architecture

### File Structure

```
locales/
├── en/
│   ├── common.json        # Shared UI strings
│   ├── errors.json        # Error messages
│   ├── auth.json          # Authentication
│   └── ...
├── es/
│   ├── common.json
│   ├── errors.json
│   └── ...
├── fr/
└── de/
```

### Backend Integration (Express)

```javascript
import i18next from 'i18next';
import Backend from 'i18next-http-backend';
import middleware from 'i18next-http-middleware';

i18next
  .use(Backend)
  .use(middleware.LanguageDetector)
  .init({
    fallbackLng: 'en',
    backend: {
      loadPath: './locales/{{lng}}/{{ns}}.json'
    },
    ns: ['common', 'errors', 'auth'],
    defaultNS: 'common'
  });

app.use(middleware.handle(i18next));

app.get('/api/message', (req, res) => {
  const msg = req.i18n.t('common:welcome');
  // req.language = detected language (e.g., 'es')
  res.json({ message: msg });
});
```

### Language Detection

Multiple strategies in order:

1. **Query string**: `?lng=es`
2. **Cookie**: Saved preference
3. **localStorage**: Browser storage
4. **Browser language**: navigator.language
5. **Server header**: Accept-Language
6. **Fallback**: Default language (usually 'en')

```javascript
i18next.use(Backend)
  .use(LanguageDetector)
  .init({
    detection: {
      order: ['querystring', 'cookie', 'localStorage', 'navigator'],
      caches: ['localStorage', 'cookie']
    }
  });
```

## Advanced Features

### 1. Lazy Loading Namespaces

```javascript
// Only load 'checkout' namespace when user reaches checkout
i18next.loadNamespace('checkout', () => {
  // Now checkout translations are ready
  const total = i18n.t('checkout:total');
});
```

Benefit: Smaller initial bundle, faster startup.

### 2. Dynamic Language Switching

```javascript
// User clicks language button
function switchLanguage(lang) {
  i18next.changeLanguage(lang);
  // All components re-render with new translations
}
```

### 3. Language-Specific Formatting

```javascript
// Different formats for different languages
const date = new Date();

const formatter = new Intl.DateTimeFormat(i18n.language, {
  year: 'numeric',
  month: 'long',
  day: 'numeric'
});

// English: "December 25, 2023"
// German: "25. Dezember 2023"
// French: "25 décembre 2023"
console.log(formatter.format(date));
```

### 4. Programmatic Translation

```javascript
// Sometimes you need to translating strings at runtime
async function translateArray(keys, options) {
  return keys.map(key => i18n.t(key, options));
}

const messages = await translateArray([
  'errors:notFound',
  'errors:unauthorized',
  'errors:serverError'
]);
// ['Page not found', 'Unauthorized', 'Server error']
```

## Common Patterns

### Pattern 1: Error Message Translation

```json
{
  "errors": {
    "INVALID_EMAIL": "Please enter a valid email",
    "PASSWORD_TOO_SHORT": "Password must be at least 8 characters",
    "USER_EXISTS": "User already exists"
  }
}
```

```javascript
app.post('/api/register', (req, res) => {
  try {
    // validation logic
  } catch (error) {
    const message = i18n.t(`errors:${error.code}`);
    res.status(400).json({ error: message });
  }
});
```

### Pattern 2: Form Label Mapping

```javascript
const formLabels = {
  firstName: i18n.t('forms:firstName'),
  lastName: i18n.t('forms:lastName'),
  email: i18n.t('forms:email'),
  phone: i18n.t('forms:phone')
};

// Use in form builder
function renderForm(labels) {
  Object.entries(labels).forEach(([key, label]) => {
    console.log(`<label>${label}</label><input name="${key}" />`);
  });
}
```

### Pattern 3: Dynamic Content Translation

```javascript
// Translate user-supplied content
async function translateUserContent(content, toLang) {
  // Use external translation API (Google Translate, etc)
  const translated = await googleTranslate(content, toLang);
  return translated;
}
```

## Real-World Challenges

### Challenge 1: Consistency Across Platforms

Same app on web, mobile, desktop needs **identical** translations:

```json
// web/locales/en/common.json
{ "login": "Log In" }

// mobile/locales/en/common.json
{ "login": "Log In" }  // Must match!

// desktop/locales/en/common.json
{ "login": "Log In" }  // Must match!
```

**Solution**: Share translation files via CDN or central service.

### Challenge 2: Translator Collaboration

Managing translations from multiple translators:

```json
// en/auth.json - 50 keys, mostly complete
// es/auth.json - 40 keys, 10 missing
// fr/auth.json - 50 keys, but quality issues
```

**Solution**: Use translation management platform (Crowdin, Lokalise):
- Professional translators work in web UI
- Automatic consistency checks
- Translation memory (reuse previous translations)
- Quality assurance workflow

### Challenge 3: RTL Language Complexity

Arabic, Hebrew, Urdu are right-to-left, but numbers are left-to-right:

```
English:  Hello 123 World (LTR)
Arabic:   مرحبا 123 عالم (RTL with LTR numbers)

// Need CSS: direction: rtl
// But also need to flip images, grids, flexbox layouts
```

### Challenge 4: Performance with Many Languages

Loading 100+ language files at startup = slow.

**Solution**: Lazy load only active language + fallback

```javascript
// Only load Spanish and English
const loadedLangs = ['es', 'en'];

i18next.on('languageChanged', (lng) => {
  if (!loadedLangs.includes(lng)) {
    i18next.loadLanguage(lng, () => {
      loadedLangs.push(lng);
    });
  }
});
```

## Best Practices

1. **Extract All Hardcoded Strings**: Any user-facing text → translation file
2. **Use Meaningful Keys**: `auth.login.button` not `btn_1`
3. **Organize by Feature**: Group related translations (nested keys)
4. **Test All Languages**: Add language switcher in dev UI
5. **Validate Completeness**: Warn if any language missing keys
6. **Performance**: Lazy load namespaces, trim bundle
7. **Professional Help**: Hire translators for quality
8. **Version Control**: Track translation changes in git
9. **Pluralization**: Always handle singular/plural
10. **RTL Testing**: Test Arabic, Hebrew layouts

## Implementation Checklist

- [ ] Install i18next and language detector
- [ ] Create locales directory structure
- [ ] Extract all hardcoded strings to JSON
- [ ] Initialize i18next with backend and detector
- [ ] Add language selector UI
- [ ] Test with multiple languages
- [ ] Handle pluralization and interpolation
- [ ] Test RTL languages (direction: rtl)
- [ ] Performance: Measure bundle impact
- [ ] Set up translation management service
- [ ] Document translation contributor guidelines

## Key Takeaway

i18next is the bridge between your English codebase and the world. Done right, adding a new language means just adding a JSON file. Done wrong, it's a maintenance nightmare.

Build with i18n from day one.
