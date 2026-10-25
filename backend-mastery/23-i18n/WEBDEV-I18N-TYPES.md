# i18n Types in Web Development

The core internationalization challenges developers face when building global web applications.

---

## ✅ COMPLETED (Modules 01-05)

| # | Type | Module | Use Case |
|---|------|--------|----------|
| 1 | **Dates & Timezone Handling** | 01 | Displaying user's local time from UTC backend |
| 2 | **Currency Formatting** | 02 | Product prices, payment amounts, financial data |
| 3 | **Text Translation (i18next)** | 03 | UI labels, messages, content in multiple languages |
| 4 | **Unicode & Edge Cases** | 04 | Emoji, special characters, string length validation |
| 5 | **DST-Aware Scheduling** | 05 | Timezone transitions, meeting scheduling across DST |

---

## 🎯 HIGH-PRIORITY WEB TYPES (To Implement)

### 6. **Address Formatting** 
- **Where:** Checkout flows, user profiles, forms
- **Challenge:** Field order varies by country (US: Street → City → State → ZIP; Japan: Prefecture → City → Address1 → Address2)
- **Example:** 
  ```
  US: 123 Main St, San Francisco, CA 94102
  UK: 123 Main Street, San Francisco, CA94 1AB
  Japan: 神奈川県横浜市中区山下町123
  ```
- **Tech:** Libaddress, Google Places API per locale

---

### 7. **Phone Number Formatting**
- **Where:** Contact forms, authentication, SMS delivery
- **Challenge:** Different country formats (US: +1-555-123-4567; France: +33 1 55 12 34 56)
- **Example:**
  ```
  US: (555) 123-4567
  France: 01 55 12 34 56
  Germany: +49 30 55123456
  ```
- **Tech:** libphonenumber-js for validation and formatting

---

### 8. **Name Ordering & Components**
- **Where:** User profiles, forms, contact management
- **Challenge:** East Asian cultures use Family Name first (Li Wei = Li is family name)
- **Design:**
  ```
  Storage: { familyName, givenName, middleName, suffix }
  NOT: { firstName, lastName }  ← WRONG!
  ```
- **Display rules per locale**

---

### 9. **List Formatting with Conjunctions**
- **Where:** Breadcrumbs, list displays, UI templates
- **Challenge:** How to join list items varies by language
- **Examples:**
  ```
  English: "Alice, Bob, and Charlie"
  French: "Alice, Bob et Charlie" (no oxford comma)
  German: "Alice, Bob und Charlie"
  Spanish: "Alice, Bob y Charlie"
  ```
- **Tech:** Intl.ListFormat API

---

### 10. **Relative Time Expressions**
- **Where:** Activity feeds, timestamps, notifications
- **Challenge:** Fuzzy time formatting ("2 hours ago" vs "in 5 minutes")
- **Examples:**
  ```
  English: "Posted 2 hours ago", "Meeting in 5 minutes"
  French: "Posté il y a 2 heures", "Réunion dans 5 minutes"
  Arabic: "تم النشر منذ ساعتين", "الاجتماع خلال 5 دقائق"
  ```
- **Tech:** Intl.RelativeTimeFormat API

---

### 11. **Ordinal Numbers**
- **Where:** Ratings, leaderboards, product rankings, pagination
- **Challenge:** Different ordinal suffixes per language
- **Examples:**
  ```
  English: 1st place, 2nd place, 3rd place, 11th place, 21st place
  French: 1er, 2e, 3e, 4e
  German: 1., 2., 3., 4., 11., 21.
  Spanish: 1.º, 2.º, 3.º, 11.º, 21.º
  ```
- **Tech:** Custom rules + Intl.PluralRules

---

### 12. **Collation & Sorting**
- **Where:** Search results, product listings, user tables sorted by name
- **Challenge:** Sort order varies: ä in German sorts differently than in Swedish
- **Rule:** Use `localeCompare()` for strings, proper database COLLATE for queries
- **Examples:**
  ```javascript
  // ✅ CORRECT:
  users.sort((a, b) => a.name.localeCompare(b.name, 'de-DE'))
  
  // ❌ WRONG:
  users.sort((a, b) => a.name < b.name ? -1 : 1)  // ASCII-only!
  ```

---

### 13. **Right-to-Left (RTL) Layout**
- **Where:** Arabic, Hebrew, Persian, Urdu interfaces
- **Challenge:** Entire UI layout mirrors (margins, padding, text alignment, icons)
- **Examples:**
  ```css
  [dir="rtl"] {
    direction: rtl;
    text-align: right;
    margin-right: 20px;  /* becomes left for RTL */
  }
  ```
- **Tech:** CSS logical properties, text-direction property

---

### 14. **Quotation Marks & Typography**
- **Where:** User-submitted content, quoted text, articles
- **Challenge:** Different quote marks per culture
- **Examples:**
  ```
  English: "Hello world"
  French: « Hello world »
  German: „Hello world"
  Spanish: «Hello world»
  ```
- **Tech:** Locale-specific typography rules

---

### 15. **Case Transformation**
- **Where:** Buttons, titles, form labels, breadcrumbs
- **Challenge:** Some letters change when transformed (Turkish "I" problem)
- **Example - Turkish "I" Problem:**
  ```javascript
  // ❌ WRONG:
  "istanbul".toUpperCase() // "iSTANBUL" - wrong!
  
  // ✅ CORRECT:
  "istanbul".toLocaleUpperCase('tr-TR') // "İSTANBUL" - correct!
  ```

---

### 16. **Measurement Units**
- **Where:** Product specs, distance/shipping, temperature
- **Challenge:** Metric vs Imperial (US, UK, Liberia use miles; rest of world uses km)
- **Examples:**
  ```
  US: "5 miles away", "6 ft 2 in tall", "156 lbs"
  UK: "8 km away", "1.88 m tall", "70 kg"
  ```

---

### 17. **Locale Validation Rules**
- **Where:** Form validation (postal codes, IDs, tax numbers)
- **Challenge:** Field formats vary per country
- **Examples:**
  ```
  US ZIP: 5 digits or ZIP+4 (12345 or 12345-6789)
  UK Postcode: SW1A 1AA (complex rules)
  Canadian: A1A 1A1
  German Postleitzahl: 5 digits
  ```

---

### 18. **Business Hours & Working Days**
- **Where:** Scheduling apps, support availability, delivery windows
- **Challenge:** Weekends and working hours vary
- **Examples:**
  ```
  US/EU: Monday-Friday 9-17, Saturday-Sunday off
  Middle East: Saturday-Wednesday 8-16, Thursday-Friday off
  ```

---

### 19. **Holidays & Non-Working Days**
- **Where:** Scheduling, availability calendars, shipping estimates
- **Challenge:** Different holidays per country (some floating, some fixed)
- **Examples:**
  ```
  US: July 4 (fixed)
  Easter: Changes each year
  Eid: Varies by lunar calendar
  ```

---

### 20. **Legal Compliance & Localization**
- **Where:** Cookie consent, privacy policy, tax calculations
- **Challenge:** Different legal requirements per country
- **Examples:**
  ```
  GDPR (EU): Explicit consent required
  CCPA (California): Opt-out rights
  LGPD (Brazil): Different data handling rules
  ```

---

### 21. **Formal Register & Politeness Levels**
- **Where:** Messaging systems, chatbots, customer support
- **Challenge:** Some languages have formal/informal distinctions
- **Examples:**
  ```
  German: "du" (informal) vs "Sie" (formal)
  French: "tu" vs "vous"
  Japanese: Casual vs Keigo (respectful)
  Spanish: "tú" vs "usted"
  ```

---

### 22. **Accessibility Localization**
- **Where:** ARIA labels, screen reader text, semantic HTML
- **Challenge:** Accessibility features must be localized too
- **Examples:**
  ```html
  <!-- English -->
  <button aria-label="Close menu">×</button>
  
  <!-- French -->
  <button aria-label="Fermer le menu">×</button>
  
  <!-- German -->
  <button aria-label="Menü schließen">×</button>
  ```

---

### 23. **Color Meaning & Cultural Context**
- **Where:** UI design, branding, status indicators
- **Challenge:** Colors have different meanings
- **Examples:**
  ```
  Red: Danger/Stop (US), Luck/Fortune (China), Death/Mourning (Thailand)
  White: Purity (US), Mourning (China, Japan)
  Green: Growth (US), Forbidden/Unlucky (parts of China)
  ```

---

## 📊 Implementation Priority for Web Dev

### **Tier 1 - Must Have** (Every website)
1. ✅ Dates & Timezones
2. ✅ Currency
3. ✅ Text Translation
4. ✅ Unicode
5. ✅ DST Scheduling
6. Address Formatting
7. Phone Numbers
8. Name Formatting
9. List Formatting
10. Relative Time

### **Tier 2 - Essential for Growth** (Most sites need when expanding)
- Collation/Sorting
- RTL Layout
- Ordinal Numbers
- Business Hours
- Holidays
- Locale Validation

### **Tier 3 - Specialized** (Domain-specific)
- Measurements (ecommerce, fitness)
- Case Transformation (UI rendering)
- Formal Register (chat/support apps)
- Legal Compliance (required for all)
- Accessibility Localization (required for all)
- Color Meaning (branding teams)

---

## Real-World Example: Global Ecommerce Site

When you build an ecommerce site serving US, UK, France, Germany, and Japan:

```
Product Page:
├─ ✅ Date/Time (item added, reviews date)
├─ ✅ Currency (prices in local currency)
├─ ✅ Address (checkout address fields in correct order)
├─ ⭐ Phone (shipping phone in local format)
├─ ✅ Name (seller name in correct order)
├─ ✅ List (related items: "A, B, and C" → "A, B et C" in French)
├─ ✅ Relative Time ("Added 2 hours ago")
├─ ✅ Measurements (size in inches/cm per region)
├─ ✅ Ordinal (ratings: "1st best seller")
├─ ✅ Collation (sort by seller name correctly)
├─ ✅ RTL (if adding Arabic/Hebrew in future)
└─ ✅ Unicode (emoji for product stars)

Checkout:
├─ ✅ Address validation (postal code rules per country)
├─ ⭐ Phone validation (E.164 format)
├─ ✅ Business hours (show support availability)
├─ ✅ Holidays (adjust shipping estimates)
├─ ✅ Legal (privacy policy per region)
└─ ✅ Accessibility (ARIA labels translated)
```

---

## Quick Reference: Which Intl APIs to Use

| Type | API/Library |
|------|-------------|
| Dates | `Intl.DateTimeFormat` |
| Currency | `Intl.NumberFormat` with `currency` option |
| Lists | `Intl.ListFormat` |
| Relative Time | `Intl.RelativeTimeFormat` |
| Plurals | `Intl.PluralRules` |
| Collation | `String.prototype.localeCompare()` |
| Phone | `libphonenumber-js` |
| Address | `libaddress` or Google Places API |

---

## Key Principle

**"Store neutral, display localized."**

```
Backend/Database:
├─ Dates: UTC ISO 8601
├─ Numbers: Neutral format
├─ Text: UTF-8 Unicode (NFC)
└─ Locale: Stored as preference BCP 47 tag (en-US, fr-FR, etc.)

Frontend/API Response → Format for display locale
```
