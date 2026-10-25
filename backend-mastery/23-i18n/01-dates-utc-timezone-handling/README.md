# Module 23.1: Dates, UTC & Timezone Handling

## Quick Start

```bash
npm install
npm start  # Starts server on port 5401
npm run dev  # For development with nodemon
```

Visit http://localhost:5401/api/now to test.

## What is this?

This module teaches you everything about working with dates, times, and timezones in JavaScript. It covers:

- **Unix Time**: The universal way to represent moments
- **UTC (Coordinated Universal Time)**: The world's time reference (offset 0)
- **Timezone Handling**: Converting between timezones correctly
- **Daylight Saving Time (DST)**: Why clocks spring forward and fall back
- **Common Pitfalls**: How timezone bugs happen and how to prevent them
- **Real-World Examples**: Email scheduling, task queuing, international systems

## Why does it matter?

Timezone bugs are among the hardest bugs to debug:

- **Google Calendar** had a bug where copying events near DST created duplicates
- **LinkedIn** scheduled posts for wrong times when DST transitions happened
- **Banking systems** stored times ambiguously, making audit logs unreliable
- **Slack** miscalculated meeting times across timezones

These happen because developers either:
1. Don't understand how timezones work
2. Try to do manual timezone math
3. Assume all users have same local timezone
4. Don't test near DST transitions

## How it works (step by step)

### Step 1: Store Times as Unix Timestamps

```javascript
// CORRECT: Unix timestamp (seconds since 1970 UTC)
const user = {
  id: 1,
  createdAt: 1711756800  // Same everywhere on Earth
};

// WRONG: Ambiguous local time
const wrongUser = {
  id: 1,
  createdAt: '2026-03-29 12:00:00'  // Which timezone?
};
```

### Step 2: Convert to User's Timezone for Display

```javascript
const unixTime = 1711756800;  // Stored in database
const userTimeZone = 'America/New_York';

const utcDate = new Date(unixTime * 1000);
const formatter = new Intl.DateTimeFormat('en-US', {
  timeZone: userTimeZone,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit'
});

const displayTime = formatter.format(utcDate);
// Shows: "03/29/2026, 08:00:00" in New York
// Shows: "03/29/2026, 13:00:00" in London
// Same Unix time, different display!
```

### Step 3: Handle DST Correctly

```javascript
// DST happens on different dates in different zones
// March 9, 2025: EST (UTC-5) → EDT (UTC-4) in US
// March 30, 2025: GMT (UTC+0) → BST (UTC+1) in UK

// Use Intl API (handles DST automatically)
// OR use date-fns-tz library
// DON'T do manual timezone math!
```

## Key concepts

### 1. **Unix Time = Universal**
Every moment has exactly one Unix timestamp. Same value everywhere.

```
Unix Timestamp: 1711756800

UTC: 12:00 PM
New York: 8:00 AM
London: 1:00 PM
Tokyo: 9:00 PM
```

### 2. **Timezone = Offset from UTC**
```
UTC-5: 5 hours behind (Eastern Standard Time)
UTC-8: 8 hours behind (Pacific Standard Time)
UTC+1: 1 hour ahead (Central European Time)
UTC+9: 9 hours ahead (Japan Standard Time)
```

### 3. **DST Shifts Offsets**
```
Spring Forward (March in US): 2:00 AM → 3:00 AM (skip 1 hour)
Fall Back (November in US): 2:00 AM → 1:00 AM (repeat 1 hour)
```

### 4. **IANA Timezone Names**
Always use IANA names (e.g., "America/New_York") never abbreviations (EST/EDT are ambiguous):

```javascript
'UTC', 'America/New_York', 'Europe/London', 'Asia/Tokyo'
'America/Los_Angeles', 'Europe/Paris', 'Australia/Sydney'
```

## Common mistakes

### ❌ Mistake 1: Ambiguous Date Parsing
```javascript
const date = new Date('2026-03-29');
// Different results in different timezones! ☠️
```

**Fix:**
```javascript
const date = new Date('2026-03-29T00:00:00Z');  // Always add 'Z' for UTC
```

### ❌ Mistake 2: Manual Timezone Math
```javascript
const localTime = new Date(utcTime.getTime() + (-5 * 60 * 60 * 1000));
// Breaks during DST transitions!
```

**Fix:**
```javascript
const formatter = new Intl.DateTimeFormat('en-US', { 
  timeZone: 'America/New_York'
});
formatter.format(utcTime);  // Automatic DST handling
```

### ❌ Mistake 3: Using getTimezoneOffset()
```javascript
const offset = new Date().getTimezoneOffset();
// Returns -300 on EST (confusing!)
// Positive = behind UTC (weird!)
```

**Fix:**
```javascript
const offsetHours = -offset / 60;  // Now it makes sense
```

### ❌ Mistake 4: Storing Local Times
```javascript
db.tasks.insert({
  scheduledTime: '09:00 AM'  // Which timezone?
});
```

**Fix:**
```javascript
db.tasks.insert({
  scheduledTimeUTC: 1711756800,
  userTimeZone: 'America/New_York',
  displayTime: '09:00 AM'  // calculated for display
});
```

### ❌ Mistake 5: Assuming Single Timezone
```javascript
const todayInSeconds = Math.floor(Date.now() / 1000);
// All users see "today" starting/ending at same Unix time
// But users in Tokyo: already tomorrow!
```

**Fix:**
```javascript
function getMidnightInTimeZone(date, timeZone) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  // Convert back to UTC midnight in that zone
}
```

## Real world usage

### Use Case 1: Send Daily Email at 9 AM User's Time

```javascript
async function sendDailyEmails() {
  const users = await db.getUsers();
  const now = new Date();
  
  for (const user of users) {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: user.preferredTimeZone,
      hour: '2-digit'  // Get hour in their timezone
    });
    
    const userHour = parseInt(formatter.format(now));
    
    if (userHour === 9) {  // 9 AM in their timezone
      await sendEmail(user);
    }
  }
}
```

### Use Case 2: Schedule Meeting Across Timezones

```javascript
const meeting = {
  title: 'Weekly Standup',
  utcTime: 1711760400,  // 2 PM UTC
  
  // Show what time it is for each location:
  // 9 AM EST (UTC-5)
  // 2 PM GMT (UTC+0)
  // 3 PM CET (UTC+1)
  // 11 PM JST (UTC+9)
};
```

### Use Case 3: Prevent DST Bugs in Event Copying

```javascript
function copyEventAcrossDST(event, durationMs) {
  // WRONG:
  const endWrong = new Date(event.start + durationMs);
  
  // RIGHT:
  const eventUTC = new Date(event.start);
  const endUTC = new Date(eventUTC.getTime() + durationMs);
  
  // Convert both back to user's timezone
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: event.userTimeZone
  });
  
  return {
    startLocal: formatter.format(eventUTC),
    endLocal: formatter.format(endUTC)
  };
}
```

## API Reference

### GET /api/now
Current time in all 8 timezones.

### GET /api/convert?iso=2026-03-29T12:00:00Z
Convert any ISO 8601 time to multiple zones.

### GET /api/timezone/America/New_York
Info about specific timezone.

### GET /api/dst-info?year=2026&tz=America/New_York
DST transitions for a year.

### POST /api/schedule-task
Schedule task in user's timezone.

## Recommended Libraries

- **date-fns-tz**: Modern, tree-shakeable
- **Day.js**: Lightweight moment.js replacement
- **Intl API**: Built-in, no library needed

## Next Module

→ Module 23.2: Currency Formatting & Intl API


