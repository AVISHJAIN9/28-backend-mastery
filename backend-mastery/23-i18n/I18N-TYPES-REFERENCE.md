# Complete i18n Types Reference

**Comprehensive guide to all types of internationalization covered in Module 23**

---

## 1. TIME & DATE i18n (Lesson 1, 6)

### 1.1 Timestamps & Epoch Time
- **Unix timestamp (seconds):** `1711756800` = March 29, 2024 12:00:00 UTC
- **Unix timestamp (milliseconds):** `1711756800000`
- **ISO 8601 format:** `2024-03-29T12:00:00Z`
- **Always store as UTC**, never local time

### 1.2 Timezone Offsets
- **UTC+0:** UTC (London, Ghana, Portugal)
- **UTC+1:** CET (Paris, Berlin, Rome, Amsterdam)
- **UTC-5:** EST (New York, Toronto, Bogotá)
- **UTC-8:** PST (Los Angeles, Seattle, Vancouver)
- **UTC+9:** JST (Tokyo, Seoul)
- **UTC+12:** NZDT (New Zealand)

### 1.3 Named Timezones (IANA)
```
America/New_York          Europe/London            Asia/Tokyo
America/Los_Angeles       Europe/Paris             Asia/Bangkok
America/Denver            Europe/Berlin            Asia/Singapore
America/Chicago           Europe/Amsterdam         Australia/Sydney
America/Toronto           Europe/Istanbul          Australia/Melbourne
```

### 1.4 Date Formatting by Locale
```
en-US:   MM/DD/YYYY (March 29, 2024)
en-GB:   DD/MM/YYYY (29 March 2024)
de-DE:   DD.MM.YYYY (29.03.2024)
fr-FR:   DD/MM/YYYY (29/03/2024)
ja-JP:   YYYY年MM月DD日 (2024年3月29日)
zh-CN:   YYYY年MM月DD日 (2024年3月29日)
ar-SA:   DD/MM/YYYY مع خيارات RTL
```

### 1.5 Time Formatting by Locale
```
en-US:   12:00 PM (12-hour clock)
en-GB:   12:00 (24-hour clock)
de-DE:   12:00 Uhr (24-hour)
fr-FR:   12h00 (24-hour)
ja-JP:   12:00 (24-hour)
ar-SA:   12:00 ص (right-to-left)
```

### 1.6 Daylight Saving Time (DST)
- **Spring Forward:** Clock jumps ahead (2 AM → 3 AM)
  - USA: Second Sunday in March
  - Europe: Last Sunday in March
  - Hour is skipped, impossible to schedule during gap
  
- **Fall Back:** Clock goes backward (1:59 AM → 1:00 AM)
  - USA: First Sunday in November
  - Europe: Last Sunday in October
  - Same hour happens twice, ambiguous which one

### 1.7 Relative Time Formatting
```
en: "2 hours ago", "in 3 days", "next month"
es: "hace 2 horas", "en 3 días", "el mes próximo"
fr: "il y a 2 heures", "dans 3 jours", "le mois prochain"
de: "vor 2 Stunden", "in 3 Tagen", "nächsten Monat"
```

### 1.8 Calendar Systems
- **Gregorian:** Most common (Jan-Dec, 365 days)
- **Islamic:** Lunar calendar (354 days)
- **Hebrew:** Lunisolar calendar (353-355 days)
- **Buddhist:** Calendar
- **Chinese:** Lunar calendar

---

## 2. NUMBER & CURRENCY i18n (Lesson 2)

### 2.1 Decimal Separators
- **Comma (,):** Germany, France, Spain, Russia, Brazil
  - Example: `1.234,56`
  
- **Period (.):** USA, UK, Canada, Australia
  - Example: `1,234.56`

- **Arabic-Indic (٫):** Arabic countries
  - Example: `١٬٢٣٤٫٥٦`

### 2.2 Thousands Separators
- **Comma (,):** `1,234,567.89` (en-US)
- **Period (.):** `1.234.567,89` (de-DE)
- **Space:** `1 234 567,89` (fr-FR, ru-RU)
- **Apostrophe ('):** `1'234'567.89` (de-CH, fr-CH)
- **None:** `1234567.89` (some Asian locales)

### 2.3 ISO 4217 Currency Codes

**Major Currencies (25+):**
```
USD  US Dollar         € EUR  Euro              £ GBP  British Pound
¥ JPY  Japanese Yen    ¥ CNY  Chinese Yuan     ₹ INR  Indian Rupee
$ CAD  Canadian Dollar $ AUD  Australian Dollar Fr CHF  Swiss Franc
kr SEK Swedish Krona   $ NZD  New Zealand Dollar kr NOK  Norwegian Krone
₩ KRW South Korean Won ₺ TRY Turkish Lira       ₽ RUB Russian Ruble
R$ BRL Brazilian Real  ₫ VND  Vietnamese Dong  د.ب BHD  Bahraini Dinar
R ZAR South African Rand د.إ AED UAE Dirham     د.ت TND Tunisian Dinar
د.ك KWD Kuwaiti Dinar
```

### 2.4 Decimal Places per Currency
```
2 decimal places (most):  USD 100.00, EUR 100,00, GBP 100.00
0 decimal places:         JPY ¥100, KRW ₩100, VND ₫100
3 decimal places:         BHD 100.000, KWD 100.000, TND 100.000
1 decimal place (rare):   CHF Fr 100.0
```

### 2.5 Currency Display Formats
```
Symbol before:   $100.00 (USA), ¥100 (Japan)
Symbol after:    100.00€ (some European), 100₹ (India)
Code before:     USD 100.00 (formal)
Code after:      100.00 USD (formal)
Name:            100 US dollars (narrative)
```

### 2.6 Currency Spacing
- **No space:** $100 (en-US)
- **Space before:** 100 € (fr-FR)
- **Space after:** $ 100 (some locales)
- **No space (symbol):** 100€ (de-DE)

### 2.7 Percent Formatting
```
en-US:  100%
de-DE:  100 %
fr-FR:  100 %
ar-SA:  ٪١٠٠ (right-to-left)
```

### 2.8 Percentage Change Display
```
Positive:  +5%, +5.2%, plus 5%
Negative:  -5%, -5.2%, minus 5%
```

### 2.9 Unit Formatting
```
Distance:  km (most), miles (USA/UK), li (China)
Weight:    kg (most), lb (USA), oz (USA)
Volume:    ml, L (most), cup (USA), fl oz (USA)
Temperature: °C (most), °F (USA), K (science)
Speed:     km/h (most), mph (USA), knots (maritime)
```

---

## 3. LANGUAGE & TEXT i18n (Lesson 3, 4)

### 3.1 Translation Keys
- **Simple key:** `welcome` → "Welcome"
- **Nested key:** `auth.login.title` → "Sign In"
- **Key with namespace:** `auth:login.title`
- **Array key:** `errors[0]` for multiple errors

### 3.2 Pluralization Forms

**English (2 forms):**
```json
{
  "item_one": "1 item",
  "item_other": "{{count}} items"
}
```

**French (2 forms):**
```json
{
  "item_one": "1 élément",
  "item_other": "{{count}} éléments"
}
```

**Russian (4 forms):**
```json
{
  "item_one": "1 элемент",
  "item_few": "{{count}} элемента",
  "item_many": "{{count}} элементов",
  "item_other": "{{count}} элемента"
}
```

**Arabic (6 forms):**
```json
{
  "item_zero": "0 عنصر",
  "item_one": "عنصر واحد",
  "item_two": "عنصران",
  "item_few": "{{count}} عناصر",
  "item_many": "{{count}} عنصراً",
  "item_other": "{{count}} عنصر"
}
```

### 3.3 Interpolation with Variables
```
"welcome": "Welcome, {{firstName}} {{lastName}}!"
"price": "Price: {{currency}}{{amount}}"
"nested": "Hello {{user.name}} from {{user.country}}"
"array": "Items: {{items.0}}, {{items.1}}"
```

### 3.4 Gender-Aware Translations

**Spanish (Gender):**
```json
{
  "welcome_m": "Bienvenido",
  "welcome_f": "Bienvenida"
}
```

**German (Gender + Articles):**
```json
{
  "article_m": "der",
  "article_f": "die",
  "article_n": "das"
}
```

**French (Adjective Agreement):**
```json
{
  "active_m": "actif",
  "active_f": "active"
}
```

### 3.5 Formal vs Informal Address
```
German:
  du (informal) vs Sie (formal)
  
French:
  tu (informal) vs vous (formal)
  
Spanish:
  tú (informal) vs usted (formal)
  
Japanese:
  あなた (casual) vs あなた様 (respectful)
  です/ます (polite) vs だ (casual)
```

### 3.6 Context-Specific Translations
```
"bank" with context="financial" → "banco"
"bank" with context="river" → "orilla"

"date" with context="calendar" → "fecha"
"date" with context="romantic" → "cita"
```

### 3.7 Language Variants (Dialects)
- **en-US:** Color, check, program
- **en-GB:** Colour, cheque, programme
- **en-AU:** Using en-GB but different slang
- **pt-BR:** Different vocabulary from pt-PT
- **zh-Hans:** Simplified Chinese (mainland)
- **zh-Hant:** Traditional Chinese (Taiwan)
- **es-ES:** Spanish from Spain
- **es-MX:** Spanish from Mexico

### 3.8 Translation Namespaces
```
auth.json       → login, register, password, etc
checkout.json   → cart, payment, shipping
profile.json    → settings, preferences, account
errors.json     → error messages
buttons.json    → common button text
messages.json   → user notifications
```

### 3.9 Language Priority/Fallback
```
User wants: Arabic (ar)
Arabic available? → Yes, use it
Arabic not available?
  → Use Arabic/Egyptian (ar-EG) if available
  → Fall back to English (en)
  → Fall back to default language
```

---

## 4. TEXT ENCODING & CHARACTERS i18n (Lesson 5)

### 4.1 Unicode Layers

**Layer 1: Code Points (Numbers)**
```
'A'   → U+0041 (65)
'é'   → U+00E9 (233)
'😀'  → U+1F600 (128512)
```

**Layer 2: Code Units (JavaScript storage)**
```
ASCII:   1 code unit (16-bit) = 1 code point
BMP:     1 code unit = 1 code point (usually)
Beyond:  2 code units (surrogate pair) = 1 code point
```

**Layer 3: Grapheme Clusters (Visual characters)**
```
'A'                 → 1 grapheme
'é'                 → 1 grapheme (or 2 if decomposed)
'👨‍👩‍👧‍👦'        → 1 family emoji (25 code units!)
'👍🏻'              → 1 emoji with skin tone (4 code units)
```

### 4.2 UTF-8 Byte Encoding
```
1 byte (1-127):        ASCII (A-Z, 0-9, special)
2 bytes (128-2047):    Latin Extended, Greek, Cyrillic
3 bytes (2048-65535):  CJK, Arabic, Vietnamese
4 bytes (65536-1M):    Emoji, rare characters

Examples:
'A'    → 0x41 (1 byte)
'é'    → 0xC3 0xA9 (2 bytes)
'あ'   → 0xE3 0x81 0x82 (3 bytes)
'😀'   → 0xF0 0x9F 0x98 0x80 (4 bytes)
```

### 4.3 Grapheme Examples

**Simple Characters:**
```
'hello'              → 5 graphemes
'こんにちは'        → 5 graphemes
'مرحبا'             → 5 graphemes (RTL)
```

**Combining Diacritics:**
```
'café' (precomposed)     → 4 graphemes
'café' (decomposed)      → 5 graphemes (e + combining acute)
```

**Emoji:**
```
'😀'                     → 1 grapheme (2 code units)
'👍'                     → 1 grapheme (2 code units)
'👍🏻' (with skin tone)  → 1 grapheme (4 code units)
'👨‍👩‍👧‍👦' (family)   → 1 grapheme (25 code units) or 7 if split
```

### 4.4 Unicode Normalization Forms

**NFC (Composed):**
```
'é' = single code point U+00E9
Used by: macOS, NFC standard, most web apps
```

**NFD (Decomposed):**
```
'é' = 'e' (U+0065) + combining acute (U+0301)
Used by: Linux, some databases
```

**NFKC (Compatibility Composed):**
```
'ﬁ' (ligature) → 'fi' (two characters)
Used for compatibility checking
```

**NFKD (Compatibility Decomposed):**
```
Most decomposed form
Rarely used
```

### 4.5 String Operations Safe Globally

**Getting Length:**
```javascript
// ❌ WRONG
'café'.length           // 4 or 5 (depending on normalization)
'😀'.length            // 2 (not 1)

// ✅ CORRECT
[...'café'].length      // 4
new Intl.Segmenter().segment('😀')  // 1 grapheme
```

**Substring/Truncation:**
```javascript
// ❌ WRONG
'hello👋'.substring(0, 6)  // May break emoji

// ✅ CORRECT
[...'hello👋'].slice(0, 6).join('')
// or use Intl.Segmenter for grapheme boundaries
```

**Case Transformation:**
```javascript
// ❌ WRONG (doesn't handle special cases)
'istanbul'.toUpperCase()  // 'ISTANBUL'

// ✅ CORRECT (handles Turkish ı)
'istanbul'.toLocaleUpperCase('tr-TR')  // 'İSTANBUL'
```

**Sorting:**
```javascript
// ❌ WRONG (byte order)
['ä', 'a', 'z'].sort()  // Locale-dependent

// ✅ CORRECT (linguistic order)
['ä', 'a', 'z'].sort(new Intl.Collator('de').compare)
```

### 4.6 Right-to-Left (RTL) Languages
```
Arabic (ar)       Standard RTL
Hebrew (he)       Standard RTL
Persian (fa)      Standard RTL
Urdu (ur)         Standard RTL
```

**Display Order:**
```
English: "Hello مرحبا"   →  Hello مرحبا  (Mixed)
Arabic:  "مرحبا Hello"    →  Hello مرحبا  (RTL rendering)
```

**CSS Required:**
```css
.rtl {
  direction: rtl;
  text-align: right;
}
```

### 4.7 Bidirectional Text (Bidi)

**Example:** Arabic sentence with English words
```
English in context:  "my email is name@example.com"
Arabic in English:   "بريدي الإلكتروني هو name@example.com"

Requires special rendering to show both LTR and RTL correctly
```

### 4.8 Database VARCHAR Sizing

**For UTF-8 encoding:**
```
VARCHAR(10):
  - ASCII: 10 characters
  - Emoji: 2-3 characters (4 bytes each)
  - CJK: 3 characters (3 bytes each)

VARCHAR(255):
  - ASCII: 255 characters
  - Emoji: 63 characters maximum
  - CJK: 85 characters maximum

RULE: VARCHAR max = column_size / max_bytes_per_char
```

**Safe Sizes:**
```
Username:     VARCHAR(50)   ← Safe for all scripts
Email:        VARCHAR(255)  ← Standard
Name:         VARCHAR(100)  ← Safe for all scripts
Description:  VARCHAR(500)  ← Safe for user content
Bio:          TEXT          ← For long content
```

### 4.9 Combining Character Examples

**Diacritics:**
```
'á' = 'a' + combining acute
'ñ' = 'n' + combining tilde
'ö' = 'o' + combining diaeresis
```

**Emoji Modifiers:**
```
'👋' + skin tone modifier → '👋🏻' (white skin)
'👨' + ZWJ + '👩' + ZWJ + '👧' → '👨‍👩‍👧' (family)
```

---

## 5. REGIONAL & CULTURAL i18n

### 5.1 Locale Identifiers (BCP 47)
```
en-US       English, United States
pt-BR       Portuguese, Brazil
zh-Hans-CN  Chinese (Simplified), China
zh-Hant-TW  Chinese (Traditional), Taiwan
```

### 5.2 Address Formatting by Region
```
USA:        123 Main St, New York, NY 10001
UK:         123 Main Street, London SW1A 1AA
Japan:      東京都千代田区丸の内1-1-1 (right-to-left)
Germany:    Hauptstraße 123, 10115 Berlin
```

### 5.3 Phone Number Formatting
```
USA:        +1 (555) 123-4567
UK:         +44 20 7946 0958
Germany:    +49 30 12345678
Japan:      +81 3-1234-5678
China:      +86 10 1234 5678
```

### 5.4 Date Formatting Examples
```
US date:     03/29/2024
UK date:     29/03/2024
ISO date:    2024-03-29
German:      29.03.2024
French:      29/03/2024
Japanese:    2024年3月29日
Chinese:     2024年3月29日 or 2024-03-29
```

### 5.5 Time Formatting Examples
```
12-hour:     3:45 PM, 3:45 PM EST
24-hour:     15:45, 15:45 CET
Japanese:    15:45 (no suffix)
Arabic:      ٣:٤٥ م (right-to-left)
```

### 5.6 Holiday Calendars
```
Christian:   Christmas (Dec 25), Easter (varies)
Islamic:     Eid al-Fitr, Eid al-Adha (lunar dates)
Jewish:      Passover, Yom Kippur (lunar dates)
Chinese:     Chinese New Year (lunar date)
Hindu:       Diwali (lunar date)
```

### 5.7 Measurement Units
```
USA:         Miles, pounds, Fahrenheit
Metric:      Kilometers, kilograms, Celsius
UK (mixed):  Miles, stones/kilograms, Celsius
China:       Kilometers, kilograms, Celsius
Japan:       Kilometers, kilograms, Celsius
```

### 5.8 Weekday Definitions
```
Most countries:  Monday = start of work week
USA/Canada:      Sunday = start of week
Middle East:     Saturday = start of work week
```

### 5.9 Business Hours by Region
```
USA:         9 AM - 5 PM, Monday-Friday
Germany:     8 AM - 5 PM, Monday-Friday
Japan:       9 AM - 6 PM, Monday-Friday (often longer)
Middle East: 8 AM - 2 PM, Sunday-Thursday (Friday off)
```

---

## 6. SPECIAL CASES & EDGE CASES

### 6.1 Timezone Edge Cases
- **UTC+0:** UTC, GMT (Greenwich Mean Time)
- **UTC+5:30:** IST (India, no DST)
- **UTC+5:45:** NPT (Nepal, unique offset)
- **UTC+8:00:** China, Singapore (entire country on one timezone)
- **UTC-3:30:** NST (Newfoundland, unusual offset)

### 6.2 Floating Point Issues
```
0.1 + 0.2 ≠ 0.3  (JavaScript/IEEE 754)
(0.1 + 0.2) === 0.3  → false
(0.1 + 0.2) === 0.30000000000000004  → true

SOLUTION: Use integer cents, not float dollars
```

### 6.3 Emoji Complexity
```
Simple:      '😀' (2 code units)
Modifier:    '👍🏻' (skin tone, 4 code units)
ZWJ:         '👨‍👩‍👧‍👦' (family, 25 code units!)
```

### 6.4 Language Collision Examples
```
'date':   Calendar (noun) vs romantic outing (noun)
'bank':   Financial institution vs river bank (noun)
'bug':    Insect vs software defect (noun)
'bat':    Animal vs sports equipment (noun)
```

### 6.5 DST Ambiguity Examples
```
November 3, 2024:
  1:30 AM EDT (UTC-4) = 5:30 AM UTC
  1:30 AM EST (UTC-5) = 6:30 AM UTC
  Both times "exist" on same date!
```

---

## 7. INTL API REFERENCE

### 7.1 Intl.DateTimeFormat
```javascript
new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  timeZone: 'America/New_York'
})
```

### 7.2 Intl.NumberFormat
```javascript
new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
})
```

### 7.3 Intl.PluralRules
```javascript
new Intl.PluralRules('ru', { type: 'cardinal' })
.select(5)  // Returns 'many'
```

### 7.4 Intl.Collator (Sorting)
```javascript
new Intl.Collator('de-DE', { sensitivity: 'accent' })
.compare('ä', 'a')  // Returns accurate comparison
```

### 7.5 Intl.Segmenter (Graphemes)
```javascript
new Intl.Segmenter('en', { granularity: 'grapheme' })
.segment('hello 👨‍👩‍👧‍👦').toArray()
// Correctly splits into grapheme clusters
```

---

## 8. i18next FRAMEWORK

### 8.1 Basic Usage
```javascript
i18n.t('translation_key')
i18n.t('translation_key', { variable: 'value' })
i18n.t('translation_key', { count: 5 })
i18n.t('namespace:key')
i18n.changeLanguage('es')
```

### 8.2 Namespace Structure
```
common:     General UI strings
auth:       Authentication messages
checkout:   Payment/checkout strings
errors:     Error messages
forms:      Form labels & validation
buttons:    Button text
messages:   User notifications
```

### 8.3 Supported Languages (12+ Core)
```
en English
es Spanish
fr French
de German
ja Japanese
zh Chinese
pt Portuguese
ar Arabic
ko Korean
it Italian
ru Russian
pl Polish
```

---

## Summary Table

| Type | Lesson | Modules | Complexity |
|------|--------|---------|-----------|
| **Timezones** | 1, 6 | 01, 05 | ⭐⭐⭐⭐ |
| **Currency** | 2 | 02 | ⭐⭐⭐ |
| **Translation** | 3, 4 | 03, 04 | ⭐⭐⭐⭐ |
| **Unicode** | 5 | 05 | ⭐⭐⭐⭐⭐ |
| **DST** | 6 | 06 | ⭐⭐⭐⭐ |

---

**Total i18n Types Covered:** 40+  
**Supported Languages:** 12+ core + 100+ via Intl API  
**Supported Currencies:** 25+  
**Supported Timezones:** 500+ via IANA  
**Character Scripts Supported:** 10+ (Latin, Cyrillic, Arabic, Devanagari, CJK, etc)

