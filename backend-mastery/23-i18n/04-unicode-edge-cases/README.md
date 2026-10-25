# Module 23.4: Unicode Edge Cases & Character Encoding

## Quick Start

```bash
npm install
npm start  # Starts server on port 5405
npm run dev  # For development with nodemon
```

Visit `http://localhost:5405/api/unicode/length?text=hello world` to test.

## What is this?

This module teaches you the pitfalls of Unicode handling:

- **Code Points vs Code Units**: Why `'😀'.length === 2` in JavaScript
- **UTF-8 Encoding**: Variable-length character encoding (1-4 bytes per character)
- **Normalization**: Why `'café' !== 'café'` sometimes
- **Grapheme Clusters**: Single visual character = multiple code points (emojis, with combining marks)
- **RTL Text**: Bidirectional text mixing (English + Arabic)
- **String Operations**: Safe truncation, sorting, case conversion globally
- **Database Sizing**: Planning VARCHAR lengths for international text

## Why does it matter?

Unicode bugs are silent and deadly:

- **Twitter**: Emojis counted as 2 characters (not 1)
- **Elasticsearch**: String sorting wrong for non-Latin scripts
- **MySQL**: VARCHAR(255) insufficient for emoji after UTF-8 encoding
- **JavaScript**: `.substring()`, `.length`, `.toUpperCase()` broken for non-ASCII
- **Email addresses**: Internationalized domain names (café.com) break systems

## Key Concepts

### 1. Code Points vs Code Units

```javascript
// A single character can have multiple representations
const emoji = '👨‍👩‍👧‍👦';  // Family emoji

emoji.length;           // 25 (UTF-16 code units - WRONG)
[...emoji].length;      // ~7 (actual characters)
Array.from(emoji).length; // 1 (same as spread)

// Why? "👨‍👩‍👧‍👦" = U+1F468 + ZWJ + U+1F469 + ZWJ + U+1F467 + ZWJ + U+1F466
// That's 8 code points, but JavaScript counts UTF-16 code units
```

### 2. **UTF-8 Byte Sizes are NOT Uniform**

```javascript
const Buffer = require('buffer').Buffer;

// ASCII: 1 byte per character
Buffer.byteLength('hello', 'utf8');        // 5

// Emoji: 4 bytes per character (sometimes more with zero-width joiners)
Buffer.byteLength('👍', 'utf8');           // 4

// Family emoji: 25 BYTES!
Buffer.byteLength('👨‍👩‍👧‍👦', 'utf8');       // 25

// Combining diacritics: Variable
Buffer.byteLength('é', 'utf8');            // 2 (precomposed)
Buffer.byteLength('é', 'utf8');            // 3 (decomposed e + combining acute)
```

### 3. **Normalization Forms: The Database Nightmare**

Two users both type "café" differently:

```javascript
// User 1: Types é directly (U+00E9)
const composed = 'café';   // NFC form
console.log(composed.length);  // 4

// User 2: Types café using e + combining accent (U+0065 + U+0301)
const decomposed = 'cafe\u0301';  // NFD form
console.log(decomposed.length);   // 5

// Are they the same?
composed === decomposed;            // FALSE! ❌
composed.normalize() === decomposed.normalize(); // TRUE! ✅

// 4 normalization forms:
// NFC (Composed):  'café' - most common, use this for storage
// NFD (Decomposed): 'cafe´' - base + diacritics separated
// NFKC (Compatible): Compatibility equivalences (fi ligature → f+i)
// NFKD (Decomposed + Compatible)
```

### 4. **Grapheme Clusters: What Humans See as "1 Character"**

```javascript
const example1 = '👋';           // Single emoji
const example2 = '👋🏻';         // Emoji with skin tone modifier (2 code points)
const example3 = '👨‍👩‍👧‍👦';      // Family (8 code points, zero-width joiners)

// Naive .length approach FAILS:
console.log('👋'.length);        // 2 ❌ (it's 1 character)
console.log('👋🏻'.length);      // 4 ❌ (it's 1 character)
console.log('👨‍👩‍👧‍👦'.length);    // 25 ❌ (it's 1 character)

// Correct approach with Intl.Segmenter:
const segmenter = new Intl.Segmenter('en', { granularity: 'grapheme' });
const arr = Array.from(segmenter.segment('👨‍👩‍👧‍👦'));
arr.length;  // 1 ✅

// Or simple spread operator (works for most cases):
[...'👋🏻'].length;   // 2 (skin tone is separate code point)
```

### 5. **RTL (Right-to-Left) Languages**

```javascript
// Arabic text: مرحبا (Hello)
const arabicText = 'مرحبا';

// JavaScript counts left-to-right, but text displays right-to-left
document.querySelector('div').textContent = arabicText;  // Looks wrong!

// FIX: Add CSS direction
<div style={{ direction: 'rtl', textAlign: 'right' }}>مرحبا</div>

// For databases: Store as-is, but remember:
// - Search may need RTL consideration
// - Substring operations may not work intuitively
// - Always normalize before comparison
```

---

## 🔨 API Reference

### Endpoints

#### `GET /api/test-strings`

List all available test strings.

**Response:**
```json
{
  "strings": ["ascii", "emoji", "emojiVariant", "rtl", "combining", "decomposed", "cjk", "mixed"]
}
```

#### `GET /api/analyze/:key` OR `POST /api/analyze`

Analyze a string's Unicode properties.

**GET response (test string):**
```json
{
  "original": "👀",
  "byteLength": 8,
  "jsLength": 4,
  "spreadLength": 2,
  "codePoints": [128064, 65039],
  "isRTL": false
}
```

**POST body:**
```json
{
  "text": "Your custom text here"
}
```

#### `GET /api/normalize/:key`

Show all 4 normalization forms.

**Response:**
```json
{
  "original": "café",
  "nfc": { "value": "café", "length": 4, "matches": true },
  "nfd": { "value": "cafe´", "length": 5, "matches": false },
  "nfkc": { "value": "café", "length": 4, "matches": true },
  "nfkd": { "value": "cafe´", "length": 5, "matches": false }
}
```

#### `GET /api/graphemes/:key`

Segment string into grapheme clusters.

**Response:**
```json
{
  "original": "👋🏻",
  "graphemeCount": 2,
  "graphemes": [
    { "char": "👋", "length": 2, "bytes": 4 },
    { "char": "🏻", "length": 2, "bytes": 3 }
  ]
}
```

#### `GET /api/truncate/:key/:length`

Demonstrate safe vs naive truncation.

**Response:**
```json
{
  "original": "Hello 👨‍👩‍👧‍👦",
  "naiveTruncate": "Hello ",
  "safeTruncate": "Hello 👨‍👩‍👧‍👦"
}
```

#### `GET /api/sort?locale=en|de|sv|fr`

Compare basic .sort() vs Intl.Collator.

**Response:**
```json
{
  "original": ["ä", "a", "b", "ö"],
  "basicSort": ["a", "ä", "b", "ö"],
  "intlSort": ["a", "ä", "b", "ö"],
  "locale": "en"
}
```

#### `GET /api/case/:key/:locale`

Locale-aware case transformations.

**Response:**
```json
{
  "key": "café",
  "toUpperCase": "CAFÉ",
  "toLowerCase": "café"
}
```

#### `GET /api/regex-test/:pattern`

Test regex with and without Unicode flag.

**Response:**
```json
{
  "pattern": ".",
  "basicRegex": { "test": false },
  "unicodeRegex": { "test": true }
}
```

#### `GET /api/health`

Server status check.

---

## 🤦 6 Common Mistakes (and How to Fix Them)

### Mistake 1: Using `.length` for Character Count

❌ **WRONG:**
```javascript
function getCharCount(str) {
  return str.length;  // Counts UTF-16 code units!
}

getCharCount('hello');      // 5 ✓
getCharCount('👋');         // 2 ✗ (it's 1!)
getCharCount('👨‍👩‍👧‍👦');    // 25 ✗ (it's 1!)
```

✅ **RIGHT:**
```javascript
function getCharCount(str) {
  return [...str].length;  // Spread operator counts code points
}

getCharCount('hello');      // 5 ✓
getCharCount('👋');         // 1 ✓
getCharCount('👨‍👩‍👧‍👦');    // 1 ✓

// For true grapheme clusters, use:
const segmenter = new Intl.Segmenter('en', { granularity: 'grapheme' });
const count = Array.from(segmenter.segment(str)).length;
```

---

### Mistake 2: Substring with Emoji Breaks Characters

❌ **WRONG:**
```javascript
const text = '🔥 Fire';
console.log(text.substring(0, 1));  // "?" or "?" or broken emoji
```

✅ **RIGHT:**
```javascript
function safeSub(str, start, length) {
  return [...str].slice(start, start + length).join('');
}

safeSub('🔥 Fire', 0, 1);  // "🔥" ✓
safeSub('🔥 Fire', 0, 3);  // "🔥 F" ✓
```

---

### Mistake 3: Regex Without Unicode Flag Fails on Non-ASCII

❌ **WRONG:**
```javascript
const regex = /./g;  // Matches any character
'café'.match(regex).length;     // 5 ✗ (includes diacritics separately)
'👨‍👩‍👧‍👦'.match(regex).length;  // 25 ✗ (each byte counted!)
```

✅ **RIGHT:**
```javascript
const regex = /./gu;  // Unicode flag handles code points
'café'.match(regex).length;     // 4 ✓
'👨‍👩‍👧‍👦'.match(regex).length;  // 8 ✓

// For grapheme-aware: use Intl.Segmenter
```

---

### Mistake 4: Comparing Unnormalized Text

❌ **WRONG:**
```javascript
const userInput1 = 'café';         // User types é directly
const userInput2 = 'cafe\u0301';   // User's keyboard sends é as e+combining
if (userInput1 === userInput2) {   // FALSE! ❌
  console.log('Same');
}
```

✅ **RIGHT:**
```javascript
if (userInput1.normalize() === userInput2.normalize()) {  // TRUE! ✓
  console.log('Same');
}

// Always normalize when storing:
function storeText(input) {
  return input.normalize('NFC');  // Standard form
}
```

---

### Mistake 5: Database VARCHAR Not Sized for UTF-8

❌ **WRONG (causing data truncation):**
```sql
-- This silently truncates emoji!
CREATE TABLE messages (
  id INT PRIMARY KEY,
  text VARCHAR(50) CHARACTER SET utf8  -- Only 50 bytes!
);

INSERT INTO messages VALUES (1, '👨‍👩‍👧‍👦'); -- 25 bytes - TRUNCATED!
```

✅ **RIGHT:**
```sql
-- UTF-8: 1-4 bytes per character
CREATE TABLE messages (
  id INT PRIMARY KEY,
  text VARCHAR(200) CHARACTER SET utf8mb4  -- 200 chars, 4 bytes each = 800 bytes
);

INSERT INTO messages VALUES (1, '👨‍👩‍👧‍👦');  -- 25 bytes - OK ✓

-- Or calculate: If max user input is 100 "characters", need 400 bytes for VARCHAR
```

---

### Mistake 6: Using Basic .sort() on Non-ASCII Text

❌ **WRONG (Swedish sorts 'ä' before 'z'):**
```javascript
const words = ['älskar', 'zebra', 'båt'];
words.sort();  // Result: ['älskar', 'båt', 'zebra'] - WRONG order for Swedish!
```

✅ **RIGHT (locale-aware):**
```javascript
const words = ['älskar', 'zebra', 'båt'];
const collator = new Intl.Collator('sv');  // Swedish collation
words.sort(collator.compare);  // ['båt', 'älskar', 'zebra'] ✓
```

---

## 💥 5 Real-World Failures

### 1. **Twitter Username Truncation (2020)**

Twitter users discovered their usernames were being truncated at 15 "characters" but emoji took more space.

```javascript
// User enters username "user_👨‍👩‍👧‍👦"
// Twitter's check: username.length <= 15
// BUG: '👨‍👩‍👧‍👦'.length = 25, so it's rejected!
```

**Lesson:** Always use `[...username].length` for character count.

---

### 2. **Node.js String Length Confusion in Loops**

Engineers wrote pagination without considering UTF-8:

```javascript
// WRONG: Trying to paginate by character count
for (let i = 0; i < text.length; i += 10) {
  // Send chunks of "10 characters"... but might be 40 bytes!
  // Splits emoji mid-sequence
}

// RIGHT: Use grapheme clusters
const segmenter = new Intl.Segmenter('en', { granularity: 'grapheme' });
const graphemes = Array.from(segmenter.segment(text));
for (let i = 0; i < graphemes.length; i += 10) {
  const chunk = graphemes.slice(i, i + 10).map(g => g.segment).join('');
}
```

---

### 3. **Database Truncation + Not-Normalized Queries**

Users couldn't search for their own data:

```javascript
// User stores: "Montréal" (NFC, composed é)
// Search for: "Montreal" (NFD, decomposed é)
// Query WITHOUT normalize() fails to match!

const stored = "Montréal".normalize('NFC');
const searched = "Montreal".normalize('NFC');
if (stored.includes(searched)) { ... }  // Works!
```

---

### 4. **URL Validation Regex Failed on Non-ASCII**

```javascript
// WRONG: Regex doesn't handle Unicode domains
const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;
emailRegex.test('user@münchen.de');  // FALSE! ❌

// RIGHT: Use URL constructor
try {
  new URL('https://user@münchen.de');
  console.log('Valid');
} catch {
  console.log('Invalid');
}
```

---

### 5. **Intl.Collator Sorting Isn't Just Locale-Aware—It's Special Character Aware**

```javascript
// In Swedish: ä, ö, å come AFTER z
const words = ['a', 'z', 'ä', 'ö', 'å'];

const enCollator = new Intl.Collator('en');
const svCollator = new Intl.Collator('sv');

en: words.sort(enCollator.compare);  // ['a', 'ä', 'ö', 'z', 'å']
sv: words.sort(svCollator.compare);  // ['a', 'z', 'ä', 'ö', 'å'] - completely different!
```

---

## ✨ Best Practices Checklist

- ✅ **Always normalize before comparison** → `.normalize('NFC')`
- ✅ **Count characters with spread** → `[...str].length` (or Intl.Segmenter for true graphemes)
- ✅ **Use Intl.Collator for sorting** → Non-ASCII text must be locale-aware
- ✅ **Regex needs /u flag** → `/pattern/gu` for Unicode-aware matching
- ✅ **Database VARCHAR sizing** → 4 bytes × max characters (UTF-8)
- ✅ **RTL text needs CSS** → `direction: rtl; text-align: right;`
- ✅ **Substring with graphemes** → Use spread or segmenter, not .substring()
- ✅ **UTF-8 in files** → Save with UTF-8 BOM or signal encoding explicitly
- ✅ **Intl.DateTimeFormat for dates** → Locale-specific date formatting
- ✅ **Intl.NumberFormat for currency** → Handles symbols, decimals, grouping

---

## 🧪 Testing Your Code

```javascript
// Test file: test-unicode.js
const assert = require('assert');

// Test 1: Character counting
assert.equal([...'👨‍👩‍👧‍👦'].length, 1);

// Test 2: Normalization
assert.equal('café'.normalize('NFC'), 'café'.normalize('NFC'));

// Test 3: Safe truncation
function safeTruncate(str, len) {
  return [...str].slice(0, len).join('');
}
assert.equal(safeTruncate('👋Hello', 1), '👋');

// Test 4: Locale sorting
const collator = new Intl.Collator('sv');
const sorted = ['ä', 'z'].sort(collator.compare);
assert.deepEqual(sorted, ['z', 'ä']);

console.log('✅ All tests passed');
```

---

## 🎓 Further Reading

- [Unicode Standard Annex #15: Normalization](https://www.unicode.org/reports/tr15/)
- [Grapheme Cluster Boundaries](https://www.unicode.org/reports/tr29/)
- [MDN: String.prototype.normalize()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/normalize)
- [MDN: Intl.Segmenter](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Segmenter)
- [UTF-8 vs UTF-16](https://en.wikipedia.org/wiki/UTF-16#Compared_to_other_encodings)

## Common mistakes

## Real world usage
