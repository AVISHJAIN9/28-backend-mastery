# Theory: Unicode Edge Cases, Character Encoding & String Handling

## What is Unicode and why it's a minefield

Unicode is a standard that assigns numbers to characters from all world languages. But the actual implementation has many pitfalls that break code silently.

A string is not as simple as you think:

```
"hello" = 5 bytes (ASCII)
"こんにちは" = 15 bytes (Japanese, UTF-8)
"👨‍👩‍👧‍👦" = 25 bytes (family emoji)  ← Single logical character, 25 bytes!
```

JavaScript was built before Unicode was standardized. Now it's mixed into the language.

## The Core Problem: Code Points vs Grapheme Clusters

### Code Points

Unicode assigns a number (code point) to every character:

```javascript
'A'.charCodeAt(0)  // 65
'é'.charCodeAt(0)  // 233
'😀'.codePointAt(0)  // 128512
```

### The Issue: Beyond Basic Multilingual Plane (BMP)

JavaScript's .length and charCodeAt() only work for characters in the first 65,536 code points.

For others (like emojis), you need surrogate pairs:

```javascript
'😀'.length  // 2 (NOT 1!)
'😀'.charCodeAt(0)  // 55357 (high surrogate)
'😀'.charCodeAt(1)  // 56832 (low surrogate)
'😀'.codePointAt(0)  // 128512 (correct code point)
```

### Grapheme Clusters (User-Perceived Characters)

One visual character can be multiple code points:

```javascript
// Family emoji = man + ZWJ + woman + ZWJ + girl + ZWJ + boy
'👨‍👩‍👧‍👦'.length  // 25

// Why? Because it's built from:
// 1. Man emoji (2 bytes as surrogate pair)
// 2. Zero-Width Joiner (invisible connector, 3 bytes)
// 3. Woman emoji (2 bytes)
// ... and so on
```

## Common Mistakes

### ❌ Mistake 1: Using .length for Character Count

```javascript
'hello'.length  // 5 ✓ Correct
'こんにちは'.length  // 5 ✓ Correct (multibyte but counted as 5)
'😀'.length  // 2 ✗ WRONG (it's 1 character, 2 code units)
'👨‍👩‍👧‍👦'.length  // 25 ✗ WRONG (1 family, 25 code units)

// Correct way
[...'hello'].length  // 5
[...'😀'].length  // 1
[...'👨‍👩‍👧‍👦'].length  // 1 (best case) or 7 (if Intl.Segmenter splits it)
```

**Fix:** Use `[...string].length` or `Array.from(string).length`

### ❌ Mistake 2: Substring with Emojis

```javascript
const text = '👨‍👩‍👧‍👦😀';
text.substring(0, 1);  // '\\uD83D' (broken character!)
text.substring(0, 2);  // '👨‍' (incomplete emoji)

// DO THIS:
[...text].slice(0, 1).join('');  // '👨‍👩‍👧‍👦'
```

**Fix:** Work with spread operator, not substring.

### ❌ Mistake 3: Regex with Unicode

```javascript
/hello/g.test('hello world');  // true ✓
/😀/g.test('I love 😀 emojis');  // false ✗ (regular regex doesn't handle above BMP)

// Fix: Use unicode flag
/😀/gu.test('I love 😀 emojis');  // true ✓
```

**Fix:** Add `u` flag to regex: `/pattern/gu`

### ❌ Mistake 4: Combining Diacritics

```javascript
const é1 = 'é';  // Single code point (U+00E9)
const é2 = 'e' + '́';  // Two code points (U+0065 + U+0301)

é1 === é2;  // false ✗ (they look the same!)

// Fix: Normalize both
é1.normalize('NFC') === é2.normalize('NFC');  // true ✓
```

**Why this matters:** Database searches fail, form validation rejects valid input.

### ❌ Mistake 5: Truncating Text without Awareness

```javascript
const message = '👨‍👩‍👧‍👦 Happy family!';
message.substring(0, 5);  // '👨' (broken emoji + noise)

// Correct
const truncated = [...message].slice(0, 5).join('');
// Now safely truncated
```

**Real scenario:** Database has VARCHAR(5), emoji stored as UTF-8 breaks.

### ❌ Mistake 6: Case Transformation with non-ASCII

```javascript
'straße'.toUpperCase();  // 'STRASSE' in German becomes 3 chars
'ς'.toUpperCase();  // Greek final sigma
'ı'.toUpperCase();  // Turkish dotless i → 'I' (wrong!)

// Must use locale-aware
'straße'.toLocaleUpperCase('de');  // Correct for German
'ι'.toLocaleUpperCase('el');  // Correct for Greek
```

**Fix:** Use `toLocaleUpperCase(locale)` not `toUpperCase()`

## Real-World Failures

### Failure 1: Twitter Username Truncation (2020)

Twitter API truncated usernames by byte count, not character count:

```javascript
username = '😀😀😀username';  // Visual: 6 characters
username.substring(0, 20);  // Expecting 20 chars but got broken emoji

// Usernames created silently invalid
// Caused logins to fail
```

**Lesson:** Count characters, not bytes. Use spread operator.

### Failure 2: Node.js String Length

Old code assumed .length = character count:

```javascript
const buffer = Buffer.from('😀', 'utf8');
buffer.length;  // 4 (bytes)

const str = '😀';
str.length;  // 2 (code units, NOT bytes)

// Confusion → Security bugs in string validation
```

**Lesson:** Understand difference: bytes vs code units vs characters.

### Failure 3: Database Text Truncation

Python database:

```python
text = '👨‍👩‍👧‍👦 Family'  
# Stored in VARCHAR(10)
# Emoji is 25 bytes in UTF-8
# Database truncates silently
# Stored as broken bytes
# Select fails
```

**Lesson:** Always test Unicode in database. Use VARCHAR(MAX) or proper sizes.

### Failure 4: Regex URL Validation

```javascript
// Chinese URL
const url = 'https://日本.jp/page';

// Common regex
/https?:\\/\\/.+/g.test(url);  // false ✗ (no unicode flag)

// With unicode flag
/https?:\\/\\/.+/gu.test(url);  // true ✓
```

**Lesson:** Non-ASCII URLs break regex without `/u` flag.

### Failure 5: Intl.Collator Sorting

Different locales sort differently:

```javascript
const words = ['ä', 'z', 'a'];

words.sort();  // Wrong order for most languages

words.sort(new Intl.Collator('de').compare);  // Correct German order: a, ä, z
words.sort(new Intl.Collator('sv').compare);  // Correct Swedish order: a, z, ä
```

**Lesson:** Never use basic .sort() for non-ASCII text.

## Advanced: Unicode Normalization

### Four Normalization Forms

```javascript
const text = 'é';  // Could be one or two code points

text.normalize('NFC');   // Composed (one code point)
text.normalize('NFD');   // Decomposed (two code points)
text.normalize('NFKC');  // Compatibility composed
text.normalize('NFKD');  // Compatibility decomposed
```

### Which to use?

- **NFC**: Default for most cases (shorter, better compatibility)
- **NFD**: Normalization form decomposed (useful for filtering)
- **NFKC**: When compatibility matters (ligatures → separate chars)
- **NFKD**: Extreme decomposition

### Example: Database Search

```javascript
// User enters 'café' (1 way)
// Database has 'café' (2 ways)
// Search fails!

// Fix: Normalize both before compare
const userInput = searchTerm.normalize('NFC');
const dbValue = dbField.normalize('NFC');
if (userInput === dbValue) {
  // Match found
}
```

## String Segmentation with Intl.Segmenter

```javascript
const segmenter = new Intl.Segmenter('en', { granularity: 'grapheme' });
const segments = Array.from(segmenter.segment('👨‍👩‍👧‍👦😀'));

segments.length;  // 2 (each emoji is one segment)
segments[0].segment;  // '👨‍👩‍👧‍👦' (complete family)
segments[1].segment;  // '😀'  
```

**Why this matters:** First time JavaScript has proper grapheme cluster support.

## Best Practices

### 1. Always Normalize Text Before Comparison

```javascript
function searchDatabase(query) {
  const normalized = query.normalize('NFC');
  return db.find(item => item.value.normalize('NFC') === normalized);
}
```

### 2. Use Intl APIs

```javascript
// Sorting
words.sort(new Intl.Collator(userLocale).compare);

// Case transformation
text.toLocaleUpperCase(userLocale);
text.toLocaleLowerCase(userLocale);

// Segmentation
const segmenter = new Intl.Segmenter(userLocale, { granularity: 'grapheme' });
const chars = Array.from(segmenter.segment(text)).map(s => s.segment);
```

### 3. Be Careful with String Length

```javascript
// NEVER trust .length for user-facing text
function getLength(str) {
  // Use grapheme clusters (proper character count)
  return [...str].length;  // Approximate
  // Or use Intl.Segmenter for perfect count
}
```

### 4. Database Text Columns

```sql
-- Good: Variable length, UTF-8
CREATE TABLE users (
  name VARCHAR(255) CHARACTER SET utf8mb4,
  bio TEXT CHARACTER SET utf8mb4
);

-- Bad: Fixed length, will truncate emoji
CREATE TABLE users (
  name CHAR(10)  -- Too restrictive
);
```

### 5. Test with Diverse Character Sets

```javascript
const testStrings = {
  emoji: '👨‍👩‍👧‍👦😀',
  rtl: 'مرحبا',  // Arabic
  combined: 'é',  // Accent
  cjk: '日本語',  // Japanese
  symbols: '©®™',
  control: 'a\\u200Bb'  // Zero-width space
};

Object.entries(testStrings).forEach(([key, str]) => {
  console.log(`${key}: length=${str.length}, spread=${[...str].length}`);
});
```

## Implementation Checklist

- [ ] Use spread operator for character iteration: `[...string]`
- [ ] Normalize text before comparison: `.normalize('NFC')`
- [ ] Use `/regex/gu` flags for Unicode support
- [ ] Test with emoji, RTL, accents, CJK characters
- [ ] Use Intl.Collator for sorting
- [ ] Use Intl.Segmenter for grapheme-aware length
- [ ] Database: Use VARCHAR with UTF-8, allow sufficient length
- [ ] Validate text truncation (avoid breaking emoji)
- [ ] Use locale-aware case transformation
- [ ] Document character encoding assumptions

## Key Takeaway

Unicode is hard because JavaScript was designed before internationalization existed.

The .length property lies. Substring breaks emojis. Basic regex fails on Chinese. 

But with the right tools (Intl APIs, spread operator, proper normalization), you can handle the entire world's characters correctly.

That's professionalism.
