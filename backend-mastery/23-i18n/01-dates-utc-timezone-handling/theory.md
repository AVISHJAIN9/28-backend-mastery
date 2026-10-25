# Module 23.1: Dates, UTC, and Timezone Handling

## 📚 Table of Contents

1. [Understanding Unix Time](#understanding-unix-time)
2. [UTC vs Timezones](#utc-vs-timezones)
3. [JavaScript Date Object Pitfalls](#javascript-date-object-pitfalls)
4. [Timezone Conversions](#timezone-conversions)
5. [Daylight Saving Time (DST)](#daylight-saving-time-dst)
6. [Best Practices](#best-practices)
7. [Real-World Failures](#real-world-failures)
8. [Implementation Patterns](#implementation-patterns)

---

## Understanding Unix Time

### What is Unix Time?

Unix Time (also called Epoch Time or POSIX time) is the number of seconds that have elapsed since 00:00:00 UTC on January 1, 1970.

```javascript
// Every instant in time has exactly one Unix timestamp
const now = Date.now(); // milliseconds since epoch
// Example: 1711756800000 represents March 29, 2026, 12:00:00 UTC

const inSeconds = Math.floor(Date.now() / 1000);
// Example: 1711756800
```

### Why Unix Time Matters

- **Universal**: Same value everywhere on Earth at the same instant
- **Language-agnostic**: Understood by every programming language
- **No ambiguity**: Never confused with local times
- **Storage**: Always store timestamps as Unix time in databases

```javascript
// CORRECT: Store Unix timestamp
const userId = 1;
const createdAt = 1711756800; // UTC, unambiguous
db.users.insert({ userId, createdAt });

// WRONG: Store formatted string
const wrongCreatedAt = '2026-03-29 12:00:00'; // Which timezone?
db.users.insert({ userId, createdAt: wrongCreatedAt }); // Ambiguous!
```

### JavaScript's Time Resolution

JavaScript Date.now() returns **milliseconds**, not seconds:

```javascript
const nowMs = Date.now();           // 1711756800000 (milliseconds)
const nowSec = Math.floor(Date.now() / 1000);  // 1711756800 (seconds)

// When sending to servers, be consistent
// Option 1: Always use milliseconds
fetch('/api/events', {
  body: JSON.stringify({ timestamp: Date.now() })
});

// Option 2: Always use seconds
fetch('/api/events', {
  body: JSON.stringify({ timestamp: Math.floor(Date.now() / 1000) })
});

// NEVER mix - creates bugs
```

---

## UTC vs Timezones

### UTC (Coordinated Universal Time)

UTC is the standard reference time with **no offset**. Everything else is relative to UTC.

```
Timeline:
┌─────────────────────────────────────────────────────────┐
│ 12:00 UTC                                               │
├─────────────────────────────────────────────────────────┤
│ 04:00 EST (UTC-5)  │ 07:00 EDT (UTC-4) │ 13:00 CET (UTC+1) │
└─────────────────────────────────────────────────────────┘
```

When it's **12:00 UTC**:
- New York: 07:00 EDT (5 hours behind)
- London: 13:00 BST (1 hour ahead)
- Tokyo: 21:00 JST (9 hours ahead)

**All these times represent the exact same moment.**

### Timezone Offsets

A timezone offset is the difference from UTC, written as ±HH:MM:

```javascript
// UTC-5: 5 hours behind UTC (Eastern Standard Time)
// UTC+1: 1 hour ahead of UTC (Central European Time)
// UTC+0: Same as UTC (GMT, no offset)

// Offset calculation:
// Local Time = UTC Time + Offset
// 12:00 UTC + (-5 hours) = 07:00 EST
// 12:00 UTC + (+1 hour) = 13:00 CET
```

### Named vs Offset Timezones

```javascript
// WRONG: Never use timezone abbreviations
'2026-03-29 12:00:00 EST' // Does EST mean Eastern Standard or Eastern Daylight?

// CORRECT: Use Named Timezones (IANA)
'2026-03-29 12:00:00 America/New_York' // Unambiguous, handles DST automatically

// ALSO CORRECT: Use UTC offset
'2026-03-29 12:00:00 UTC-05:00' // Clear and explicit
```

### IANA Timezone Database

The IANA (Internet Assigned Numbers Authority) maintains a comprehensive timezone database:

```javascript
// Common IANA timezone names:
'UTC'                  // Coordinated Universal Time
'America/New_York'     // Eastern (handles EST/EDT automatically)
'America/Los_Angeles'  // Pacific
'Europe/London'        // UK
'Europe/Paris'         // Central European
'Asia/Tokyo'           // Japan Standard Time
'Australia/Sydney'     // Australian Eastern
'Asia/Kolkata'         // India

// Use a library like date-fns-tz or dayjs to work with these
import { zonedTimeToUtc, utcToZonedTime } from 'date-fns-tz';

const timeZone = 'America/New_York';
const utcDate = new Date('2026-03-29T17:00:00Z');

// Convert UTC to local timezone
const zonedDate = utcToZonedTime(utcDate, timeZone);
// Result: 2026-03-29T13:00:00 (EDT is UTC-4)
```

---

## JavaScript Date Object Pitfalls

### Pitfall 1: Date Parsing is Ambiguous

```javascript
// ❌ DANGEROUS: Assumes local browser timezone
const date = new Date('2026-03-29');
// On UTC-5 browser: March 28, 19:00 UTC
// On UTC+1 browser: March 28, 23:00 UTC
// DIFFERENT times! ☠️

// ✅ CORRECT: Explicitly specify UTC
const date = new Date('2026-03-29T00:00:00Z');
// Same time everywhere: March 29, 00:00 UTC
```

### Pitfall 2: Date.toString() Includes Local Timezone

```javascript
const date = new Date('2026-03-29T12:00:00Z');

// ❌ WRONG: Output includes local timezone
console.log(date.toString());
// On EST: "Sat Mar 29 2026 07:00:00 GMT-0500 (Eastern Daylight Time)"
// On JST: "Sat Mar 29 2026 21:00:00 GMT+0900 (Japan Standard Time)"

// ✅ CORRECT: Use toISOString for UTC representation
console.log(date.toISOString());
// Everyone sees: "2026-03-29T12:00:00.000Z"
```

### Pitfall 3: Timezone Offset from getTimezoneOffset()

```javascript
const date = new Date('2026-03-29T12:00:00Z');
const offset = date.getTimezoneOffset();

console.log(offset); // Returns -300 on EST browser
// Negative? Because JavaScript confused API: positive offset = behind UTC
// 300 minutes = 5 hours = UTC-5 = EST

// ✅ CORRECT INTERPRETATION:
const offsetHours = -offset / 60;
console.log(offsetHours); // -5 (behind UTC)
```

### Pitfall 4: Month is Zero-Indexed

```javascript
// ❌ WRONG
const date = new Date(2026, 3, 29, 12, 0, 0);
// Creates April 29 (month 3 = April, not March!)

// ✅ CORRECT
const date = new Date(2026, 2, 29, 12, 0, 0);
// Creates March 29 (month 2 = March)

// ✅ BETTER: Use ISO string
const date = new Date('2026-03-29T12:00:00Z');
```

### Pitfall 5: Daylight Saving Time Confusion

```javascript
// When DST happens, times "spring forward" (2:00 AM → 3:00 AM)
// or "fall back" (2:00 AM → 1:00 AM)

const beforeDST = new Date('2026-03-08T06:59:59Z'); // 01:59:59 EST
const afterDST = new Date('2026-03-08T07:00:01Z');  // 03:00:01 EDT

// ❌ Wrong assumption: 1 second difference, but 1 hour actual time skip
const diff = afterDST - beforeDST;
console.log(diff); // 2000ms (correct time), but times show 1 second later

// ✅ CORRECT: Always compare using Unix timestamps
const tz = 'America/New_York';
const beforeLocal = utcToZonedTime(beforeDST, tz); // 01:59:59 EST
const afterLocal = utcToZonedTime(afterDST, tz);   // 03:00:01 EDT
// These are correct! 3:00:01 EDT is 1 hour 1 second after 1:59:59 EST
```

---

## Timezone Conversions

### Converting UTC to Local Timezone

```javascript
const utcTime = new Date('2026-03-29T12:00:00Z');
const timeZone = 'America/New_York';

// Option 1: Using Intl API (built-in)
const formatter = new Intl.DateTimeFormat('en-US', {
  timeZone,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false
});

const localString = formatter.format(utcTime);
// 03/29/2026, 08:00:00 (EDT is UTC-4)

// Option 2: Using date-fns-tz library
import { utcToZonedTime, format } from 'date-fns-tz';

const zonedDate = utcToZonedTime(utcTime, timeZone);
const formatted = format(zonedDate, 'yyyy-MM-dd HH:mm:ss zzz', { timeZone });
// 2026-03-29 08:00:00 EDT
```

### Converting Local Time to UTC

```javascript
// User in New York enters: "2026-03-29 08:00:00"
// Is that EDT (UTC-4) or EST (UTC-5)?

import { zonedTimeToUtc } from 'date-fns-tz';

const timeZone = 'America/New_York';
const localString = '2026-03-29 08:00:00';

const utcDate = zonedTimeToUtc(new Date(localString), timeZone);
// Library handles DST: knows March 29 is EDT, returns appropriate UTC time
```

### Handling Ambiguous Times (Fall-Back DST)

When clocks "fall back" (2:00 AM → 1:00 AM), times 1:00-1:59 AM occur twice:

```javascript
// October 27, 2026, 2:00 AM EDT becomes 1:00 AM EST
// Times between 1:00-1:59 AM are ambiguous

import { zonedTimeToUtc, isAfter } from 'date-fns-tz';

const timeZone = 'America/New_York';
const ambiguousTime = '2026-10-27 01:30:00';

// First 1:30 AM (EDT, UTC-4)
const first = zonedTimeToUtc(new Date(ambiguousTime), timeZone, { 
  disambiguation: 'earlier' 
});
// 2026-10-27 05:30:00 UTC

// Second 1:30 AM (EST, UTC-5)
const second = zonedTimeToUtc(new Date(ambiguousTime), timeZone, { 
  disambiguation: 'later' 
});
// 2026-10-27 06:30:00 UTC
```

### Finding Timezone Offset at a Specific Date

Offset changes with DST:

```javascript
function getTimezoneOffset(date, timeZone) {
  // Create UTC date
  const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
  
  // Create local date in target timezone
  const localDate = new Date(date.toLocaleString('en-US', { timeZone }));
  
  // Difference in minutes
  return (utcDate - localDate) / (1000 * 60);
}

const march = new Date('2026-03-29');
const october = new Date('2026-10-27');

console.log(getTimezoneOffset(march, 'America/New_York'));  // -240 (EDT, UTC-4)
console.log(getTimezoneOffset(october, 'America/New_York')); // -300 (EST, UTC-5)
```

---

## Daylight Saving Time (DST)

### How DST Works

```
Spring Forward (March):
1:59:59 AM EST → 3:00:00 AM EDT
Time skips from 01:59 to 03:00 (2:00 AM doesn't exist!)

Fall Back (October/November):
1:59:59 AM EDT → 1:00:00 AM EST
1:00-1:59 AM happens twice (ambiguous)
```

### Not All Locations Observe DST

```javascript
// Locations that DO observe DST:
'America/New_York'        // EST/EDT
'Europe/Paris'            // CET/CEST
'Asia/Jerusalem'          // IST/IDT

// Locations that DON'T observe DST:
'GMT'                     // No DST
'Etc/GMT+5'              // Fixed offset, no DST
'Asia/Tokyo'             // No DST
'Australia/Brisbane'     // No DST
```

### DST Transitions in JavaScript

```javascript
// March 9, 2025, 2:00 AM EST → 3:00 AM EDT (spring forward)

const before = new Date('2025-03-09T07:00:00Z'); // 02:00 EST
const after = new Date('2025-03-09T08:00:00Z');  // 03:00 EDT in theory

// But calculating local times is tricky!
// ✅ Use a library to handle this:
import { utcToZonedTime } from 'date-fns-tz';

const beforeLocal = utcToZonedTime(before, 'America/New_York');
const afterLocal = utcToZonedTime(after, 'America/New_York');

console.log(beforeLocal.toISOString()); // 2025-03-09T02:00:00
console.log(afterLocal.toISOString());  // 2025-03-09T03:00:00
```

---

## Best Practices

### 1. Always Store UTC in Database

```javascript
// ✅ CORRECT
const user = {
  userId: 1,
  name: 'Alice',
  createdAt: 1711756800,           // Unix timestamp (UTC)
  lastLoginAt: 1711843200,         // Unix timestamp (UTC)
  birthDate: '1990-05-15'          // Date only (no time component)
};

// ❌ WRONG
const wrongUser = {
  userId: 1,
  name: 'Alice',
  createdAt: '2026-03-29 12:00:00', // Which timezone?
  lastLoginAt: 'Mar 29, 2026, 12:00 PM' // Ambiguous!
};
```

### 2. Display Time in User's Timezone

```javascript
async function getUserDashboard(userId) {
  // Get user from database
  const user = await db.getUser(userId);
  
  // User stored with their timezone preference
  const userTimeZone = user.preferredTimeZone; // 'America/New_York'
  
  // Convert UTC times to user's timezone for display
  return {
    userId: user.userId,
    name: user.name,
    createdAtUTC: user.createdAt,
    createdAtLocal: formatInTimeZone(
      new Date(user.createdAt * 1000),
      userTimeZone,
      'yyyy-MM-dd HH:mm:ss zzz'
    ),
    timezone: userTimeZone
  };
}
```

### 3. Store User Timezone Preference

```javascript
const userSchema = {
  userId: Number,
  email: String,
  
  // Timezone preference - IANA timezone name
  preferredTimeZone: {
    type: String,
    default: 'UTC',
    enum: [
      'UTC',
      'America/New_York',
      'Europe/London',
      'Asia/Tokyo',
      // ... all IANA timezones
    ]
  },
  
  // When user created account (UTC timestamp)
  createdAt: Number,
  
  // When user last logged in (UTC timestamp)
  lastLoginAt: Number
};
```

### 4. Use ISO 8601 Format for Serialization

```javascript
// When sending times in JSON/API responses
const response = {
  event: 'user_login',
  
  // ✅ Use ISO 8601 format with Z for UTC
  timestamp: new Date(1711756800000).toISOString(),
  // Result: "2026-03-29T12:00:00.000Z"
  
  // Include timezone info when needed
  userTimeZone: 'America/New_York',
  localTime: '2026-03-29T08:00:00-04:00' // ISO 8601 with offset
};
```

### 5. Handle Relative Times Carefully

```javascript
// ❌ WRONG: Assumes everyone has same local time
function isToday(timestamp) {
  const date = new Date(timestamp * 1000);
  const today = new Date();
  return date.getDate() === today.getDate();
}
// Returns different results in different timezones!

// ✅ CORRECT: Compare in user's timezone
function isTodayInTimeZone(timestamp, timeZone) {
  const utcDate = new Date(timestamp * 1000);
  const zonedDate = utcToZonedTime(utcDate, timeZone);
  
  const todayInZone = utcToZonedTime(new Date(), timeZone);
  
  return zonedDate.toDateString() === todayInZone.toDateString();
}

isTodayInTimeZone(1711756800, 'America/New_York'); // Based on NY time
isTodayInTimeZone(1711756800, 'Asia/Tokyo');       // Based on Tokyo time
```

### 6. Batch Operations Across Timezones

```javascript
// Get all users who should receive daily digest email
async function getUsersForDailyDigest() {
  // Get all users with their timezone
  const users = await db.getAllUsers();
  
  const now = new Date();
  const recipients = [];
  
  for (const user of users) {
    // Convert current time to user's timezone
    const userLocalTime = utcToZonedTime(now, user.preferredTimeZone);
    
    // Send digest at 9 AM their local time
    if (userLocalTime.getHours() === 9 && userLocalTime.getMinutes() === 0) {
      recipients.push(user);
    }
  }
  
  return recipients;
}
```

---

## Real-World Failures

### Failure 1: Assumption Bug in Google Calendar

Google Calendar had a bug where copying events near DST transitions created duplicate events. The issue: calculating time differences without considering DST changes.

```javascript
// BUGGY CODE (simplified version of actual bug)
function copyEvent(event) {
  const originalTime = new Date(event.start);
  const newTime = new Date(originalTime.getTime() + duration);
  
  // If DST happens between original and new time,
  // the local time might be off by an hour!
}

// CORRECT APPROACH
function copyEvent(event, timeZone) {
  const originalTime = new Date(event.start);
  
  // Add duration in UTC (not affected by DST)
  const newUTCTime = new Date(originalTime.getTime() + duration);
  
  // Convert back to user's timezone (DST handled correctly)
  const zonedTime = utcToZonedTime(newUTCTime, timeZone);
  
  return zonedTime;
}
```

### Failure 2: Banking System Time Confusion

A banking system created transactions with times in user's local timezone, then later tried to reconstruct UTC times for auditing. Since users were in different timezones, many transactions had incorrect audit times.

```javascript
// ❌ WRONG: Transaction stored with local time
transaction = {
  userId: 123,
  amount: 100,
  timestamp: '2026-03-29 14:30:00'  // Which timezone??
};

// When auditing days later, unclear if this was
// 14:30 EST (19:30 UTC) or 14:30 JST (05:30 UTC)

// ✅ CORRECT: Always store UTC
transaction = {
  userId: 123,
  amount: 100,
  timestampUTC: 1711774200,          // Unix timestamp
  userTimeZone: 'America/New_York'   // Store user's timezone
};
```

### Failure 3: LinkedIn Scheduling Bug

LinkedIn allowed scheduling posts "3 hours from now" but didn't account for DST changes. If DST happened in those 3 hours, posts scheduled for wrong time.

```javascript
// ❌ WRONG: Add hours in local time
function schedulePost(delayHours) {
  const date = new Date();
  date.setHours(date.getHours() + delayHours);
  return date;
}
// If DST happens: 2:00 AM → 3:00 AM, so 3 hours becomes 4 hours!

// ✅ CORRECT: Add hours in UTC
function schedulePost(delayHours, timeZone) {
  const now = new Date();
  
  // Add milliseconds (always reliable)
  const futureUTC = new Date(now.getTime() + delayHours * 60 * 60 * 1000);
  
  // Convert to user's timezone for display
  const futureLocal = utcToZonedTime(futureUTC, timeZone);
  
  return futureLocal;
}
```

---

## Implementation Patterns

### Pattern 1: Storing Schedule Times

```javascript
// Store scheduled tasks with user's timezone
const schema = {
  userId: Number,
  dailyReportTime: '09:00',           // 9 AM in their timezone
  userTimeZone: 'America/New_York',
  
  createdAt: Number,  // Unix timestamp
  updatedAt: Number   // Unix timestamp
};

// Find tasks that should run now
async function getTasksToRun() {
  const now = new Date();
  const tasks = await db.getTasks();
  
  const tasksToRun = tasks.filter(task => {
    const userLocalTime = utcToZonedTime(now, task.userTimeZone);
    const [hour, minute] = task.dailyReportTime.split(':');
    
    return userLocalTime.getHours() === parseInt(hour) &&
           userLocalTime.getMinutes() === parseInt(minute);
  });
  
  return tasksToRun;
}
```

### Pattern 2: Multi-Timezone Display

```javascript
// Convert one UTC time to multiple timezones
function formatTimeInMultipleZones(utcTimestamp) {
  const utcDate = new Date(utcTimestamp * 1000);
  
  const zones = [
    'America/New_York',
    'Europe/London',
    'Asia/Tokyo'
  ];
  
  return zones.map(zone => {
    const zonedDate = utcToZonedTime(utcDate, zone);
    return {
      timezone: zone,
      local: format(zonedDate, 'yyyy-MM-dd HH:mm:ss zzz', { timeZone: zone })
    };
  });
}

// Output:
// [
//   { timezone: 'America/New_York', local: '2026-03-29 08:00:00 EDT' },
//   { timezone: 'Europe/London', local: '2026-03-29 12:00:00 GMT' },
//   { timezone: 'Asia/Tokyo', local: '2026-03-29 21:00:00 JST' }
// ]
```

### Pattern 3: Comparing Times Across Timezones

```javascript
// Compare if two users' "today" is the same
function isSameDayInBothTimezones(user1, user2) {
  const now = new Date();
  
  const user1Today = utcToZonedTime(now, user1.timeZone).toDateString();
  const user2Today = utcToZonedTime(now, user2.timeZone).toDateString();
  
  return user1Today === user2Today;
}

// User in New York: March 29
// User in Tokyo: March 30 (already next day there!)
```

### Pattern 4: Finding Midnight in User's Timezone

```javascript
function getMidnightInTimeZone(date, timeZone) {
  // Start with user's local midnight
  const localMidnight = new Date(date.toLocaleString('en-US', { 
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }));
  
  // Set to midnight
  localMidnight.setHours(0, 0, 0, 0);
  
  // Convert back to UTC
  const utcMidnight = zonedTimeToUtc(localMidnight, timeZone);
  
  return utcMidnight;
}

// Get daily report for user in Tokyo
const userTimeZone = 'Asia/Tokyo';
const today = new Date();
const todayMidnightUTC = getMidnightInTimeZone(today, userTimeZone);
const tomorrowMidnightUTC = getMidnightInTimeZone(
  new Date(today.getTime() + 24 * 60 * 60 * 1000),
  userTimeZone
);

// Get all events for "today" in Tokyo timezone
const events = await db.getEventsBetween(todayMidnightUTC, tomorrowMidnightUTC);
```

---

## Summary

### Key Takeaways

1. **Store UTC always** - Avoid timezone ambiguity in database
2. **Display based on user preference** - Show local time based on their timezone setting
3. **Use libraries** - Don't calculate timezones manually (use date-fns-tz, dayjs, or Intl API)
4. **Handle DST** - Libraries automatically adjust for daylight saving time
5. **Be explicit** - Always specify timezone in code, never assume local time
6. **Test edge cases** - Test near DST transitions and midnight boundaries
7. **ISO 8601** - Use UTC with Z suffix: "2026-03-29T12:00:00Z"

### Recommended Libraries

```javascript
// Modern approach (Tree-shakeable, lightweight)
import { format, parse, isWithinInterval } from 'date-fns';
import { utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz';

// Or use Day.js
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

// Or use Intl API (built-in, no library needed)
const formatter = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York' });
```

---

## Useful Resources

- **IANA Timezone Database**: https://www.iana.org/time-zones
- **TC39 Temporal Proposal**: Upcoming JavaScript date/time API (no timezone confusion!)
- **RFC 3339**: Internet Date/Time Format (ISO 8601)
- **date-fns-tz**: Popular timezone library
- **Dayjs**: Lightweight moment.js alternative
