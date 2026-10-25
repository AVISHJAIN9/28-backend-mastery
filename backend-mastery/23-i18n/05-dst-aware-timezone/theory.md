# Theory: Daylight Saving Time & Timezone Edge Cases

## The DST Problem

**Daylight Saving Time (DST)** is when clocks shift forward (spring) and backward (fall) to make better use of daylight. This simple idea creates complex bugs.

### Spring Forward: Missing Hour

In March, clocks jump ahead at 2:00 AM → 3:00 AM

```
1:59:59 AM EST (UTC-5)  →  3:00:00 AM EDT (UTC-4)
2:00-2:59 AM DOES NOT EXIST
```

It's impossible to create a 2:30 AM appointment that day.

### Fall Back: Duplicate Hour

In November, clocks go back at 2:00 AM → 1:00 AM

```
1:59:59 AM EDT (UTC-4)  →  1:00:00 AM EST (UTC-5)
1:00-1:59 AM HAPPENS TWICE
```

An event logged at 1:30 AM is ambiguous—which occurrence?

## Why JavaScript Fails

```javascript
const ambiguous = new Date('2024-11-03T01:30:00');
// Which 1:30 AM? First or second?

// There's NO way to know!
// JavaScript has no concept of ambiguous times.
```

## Solutions

### 1. Always Store UTC

```javascript
// CORRECT: Always store as UTC
const utcTime = new Date('2024-03-10T06:30:00Z');
// This is unambiguous: 6:30 AM UTC

// Convert to local time when displaying
const formatter = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/New_York',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit'
});

console.log(formatter.format(utcTime));
// "03/10/2024, 02:30 AM" (before DST transition)
```

### 2. Use IANA Timezone Names (Not Offsets)

```javascript
// WRONG: Offset changes on DST transitions
const time1 = '2024-06-15T12:00:00 EDT';  // EDT = UTC-4
const time2 = '2024-12-15T12:00:00 EST';  // EST = UTC-5
// Same clock time, different UTC depending on WHEN

// CORRECT: Use IANA name that handles DST automatically
const time = '2024-06-15T12:00:00 America/New_York';
// Automatically EDT in summer, EST in winter
```

### 3. Use Date Libraries with DST Awareness

```javascript
const { parseIso, zonedTimeToUtc } = require('date-fns-tz');

// Library handles DST transition ambiguity
const ambiguousTime = '2024-11-03T01:30:00';
const zone = 'America/New_York';

// Option 1: Use first occurrence
const utc1 = zonedTimeToUtc(ambiguousTime, zone);

// Option 2: Use second occurrence
const utc2 = zonedTimeToUtc(ambiguousTime, zone);
```

## DST Transitions by Region (2024)

### North America

- **Spring Forward**: March 10, 2:00 AM → 3:00 AM (EDT)
- **Fall Back**: November 3, 2:00 AM → 1:00 AM (EST)

### Europe

- **Spring Forward**: March 31, 1:00 AM → 2:00 AM (CEST)
- **Fall Back**: October 27, 2:00 AM → 1:00 AM (CET)

### Australia (Reverse Seasons!)

- **Spring Forward**: (Southern hemisphere spring = October)
- **Fall Back**: (Southern hemisphere fall = April)
- Dates vary by state!

### No DST

- UTC (no DST)
- Japan (JST)
- China (CST)
- India (IST)
- Most of Africa

## Real-World DST Disasters

### Disaster 1: Google Calendar Infinite Loop

When copying an event near DST, Google Calendar created duplicates infinitely.

**Root cause**: Didn't handle ambiguous times correctly

**Lesson**: Test extensively around DST dates.

### Disaster 2: Airbnb Double-Booked Accommodations

A guest booked for 1:30 AM - 3:30 AM on November 3 (DST transition).

- The system didn't realize 1:30 AM happens twice
- Two guests booked the same property for what they thought was the same time
- Overbooking disaster

**Lesson**: Treat ambiguous times with extreme caution. Always confirm user's intended UTC time.

### Disaster 3: Stock Exchange Trading Bot

Cron job scheduled to run at 2:30 AM EST crashed on DST day.

- When clocks went forward, 2:30 AM never happened
- When clocks went back, 2:30 AM happened twice
- Bot executed trades at wrong times
- Financial loss

**Lesson**: Don't use local times for scheduled tasks. Use UTC + named timezone.

### Disaster 4: Production Database Corruption

Batch job that runs "at 2:00 AM local time":

```javascript
// WRONG: Uses local system time
const runAt = '02:00:00';
// On DST spring forward: job skipped (time doesn't exist)
// On DST fall back: job runs twice (time exists twice!)
```

**Lesson**: All scheduled jobs must use UTC or explicit IANA timezone.

### Disaster 5: Database Record Ordering

Records logged at 1:30 AM EDT followed by records at 1:30 AM EST:

```javascript
// Both have same "local" time
{ timestamp: '01:30:00', event: 'user_login' }
{ timestamp: '01:30:00', event: 'user_logout' }

// But which happened first? Unclear!
```

**Lesson**: Always store timestamps as UTC integers.

## DST-Safe Patterns

### Pattern 1: Always Validate DST-Critical Times

```javascript
function scheduleTask(localTime, timezone) {
  // Check if this time is ambiguous on this date
  const isDSTAmbiguous = checkAmbiguity(localTime, timezone);
  
  if (isDSTAmbiguous) {
    // Ask user to confirm which occurrence they meant
    throw new Error('This time is ambiguous due to DST');
  }
  
  const utcTime = convertToUTC(localTime, timezone);
  scheduleAt(utcTime);
}
```

### Pattern 2: Store Schedule in UTC + Timezone Pair

```json
{
  "taskId": "email_daily_remind",
  "utcTime": 1711756800,
  "timezone": "America/New_York",
  "description": "Send daily reminder at 9:00 AM America/New_York"
}
```

```javascript
// When running task
function shouldRunNow(task) {
  const now = new Date();
  const nowInTZ = convertToTimezone(now, task.timezone);
  const taskLocalTime = getLocalTime(task.utcTime, task.timezone);
  
  return isSameTime(nowInTZ, taskLocalTime);
}
```

### Pattern 3: Cron Jobs with Timezone

```javascript
const schedule = require('node-schedule');

// Schedule in specific timezone
const rule = new schedule.RecurrenceRule();
rule.hour = 2;
rule.minute = 30;
rule.tz = 'America/New_York';

schedule.scheduleJob(rule, () => {
  // Automatically handles DST transitions
  console.log('Running at 2:30 AM America/New_York');
});
```

### Pattern 4: Event Deduplication Across DST

```javascript
function processEvents(events) {
  const processed = new Set();
  
  events.forEach(event => {
    // Use UUID to prevent processing same event twice
    if (!processed.has(event.uuid)) {
      // Process event
      processed.add(event.uuid);
    }
  });
}
```

## Advanced: Handling All DST Edge Cases

### The Holy Trinity: UTC + IANA Timezone + Unique ID

```javascript
{
  "eventId": "uuid-123456",
  "utcTime": 1711756800,  // Always UTC
  "timezone": "America/New_York",  // For display
  "localDisplayTime": "2024-03-10 02:30",  // For UI only
  "note": "This time doesn't exist, but was probably meant as 3:00-3:30"
}
```

This pattern handles:
- ✅ Impossibly-scheduled times (spring forward)
- ✅ Ambiguously-scheduled times (fall back)
- ✅ DST transitions in different regions
- ✅ Prevention of duplicate processing
- ✅ Clear audit trail

## Testing DST in Code

```javascript
// Test around actual DST transitions
const tests = [
  {
    date: '2024-03-09T02:30:00Z',  // Before spring forward
    tz: 'America/New_York',
    expected: '7:30 PM EDT'  // Previous day, EDT
  },
  {
    date: '2024-03-10T06:30:00Z',  // After spring forward
    tz: 'America/New_York',
    expected: '2:30 AM EDT'
    // Note: 2:30 AM EDT literally means 6:30 AM UTC (past the transition)
  },
  {
    date: '2024-11-03T05:30:00Z',  // Before fall back
    tz: 'America/New_York',
    expected: '1:30 AM EDT'  // During first occurrence
  },
  {
    date: '2024-11-03T06:30:00Z',  // After fall back
    tz: 'America/New_York',
    expected: '1:30 AM EST'  // During second occurrence (different offset!)
  }
];

tests.forEach(test => {
  // Verify timezone calculations
  const result = convertToTimezone(test.date, test.tz);
  assert.equal(result, test.expected);
});
```

## DST Across Global Services

### CDNs and Edge Computing

```javascript
// API running in Singapore (no DST)
// User in New York (has DST)
// Cache invalidation time in user's timezone

// ❌ WRONGUsing "midnight" in user's timezone
// Some days cache invalidates at 4 AM UTC, others at 5 AM UTC

// ✅ CORRECT: Use UTC caches
// Cache always invalidates at 5 AM UTC
// = midnight EST in winter, 1 AM EDT in summer
```

### Scheduled Reports

```javascript
// Report user wants at "9 AM my time" every day

// ❌ Store as: 9:00 AM local
// Runs at different UTC times depending on DST

// ✅ Store as: 9:00 AM America/New_York (with timezone)
// Runs at same UTC time (14:00 UTC in winter, 13:00 UTC in summer)
```

## Best Practices

1. **Always store times as UTC**
2. **Use IANA timezone names** (America/New_York, not EST/EDT)
3. **Validate ambiguous times** during DST transitions
4. **Use UUID for events** to prevent duplicate processing
5. **Never schedule with local time**, always UTC + timezone
6. **Test thoroughly** around March 10 and November 3
7. **Use battle-tested libraries** (date-fns-tz, Day.js, Temporal)
8. **Log DST transitions** for debugging
9. **Alert on DST events** in monitoring systems
10. **Document heavily** - DST is confusing for all developers

## Implementation Checklist

- [ ] Audit codebase for local time assumptions
- [ ] Convert all datetime storage to UTC
- [ ] Add IANA timezone field to appointments/schedules
- [ ] Implement DST-aware validation for scheduling
- [ ] Add unique IDs to prevent duplicate processing
- [ ] Test around March 10 and November 3
- [ ] Review cron jobs and background tasks
- [ ] Update monitoring to alert on DST transitions
- [ ] Document timezone handling in API docs
- [ ] Train team on DST pitfalls

## Key Takeaway

DST is humanity's worst decision masquerading as an efficiency measure. Your job is to handle it correctly regardless.

The solution: **UTC everywhere, timezone for display only**, and **comprehensive testing around DST dates**.

## The DST Problem in 60 Seconds

Daylight Saving Time (DST) causes two catastrophic bugs:

1. **Ambiguous Hour (Spring Forward)**: When clocks go back 1 hour, the same time happens twice
   ```
   2:30 AM occurs TWICE (2:00 AM → 1:00 AM)
   Is 1:30 AM the first or second occurrence? → AMBIGUOUS!
   ```

2. **Missing Hour (Fall Back)**: When clocks go forward 1 hour, an hour doesn't exist
   ```
   2:30 AM doesn't exist (1:59 AM → 3:00 AM)
   Scheduling a meeting at 2:30 AM? → ERROR!
   ```

JavaScript and most languages handle DST poorly. They just store local time without knowing which occurrence happened.

## Why DST Exists (And Why It's Outdated)

Created in WWI to save energy, DST shifts the clock to use more daylight hours:

```
Winter (Standard Time): UTC-5  (Eastern Standard Time)
Summer (Daylight Time):  UTC-4  (Eastern Daylight Time)
```

But:
- Energy savings are minimal (proven by studies)
- Causes 40% more heart attacks on DST transition day (seriously)
- Different countries observe DST on different dates
- Some regions never observe DST at all

Yet billions of systems still deal with it.

## The Core Problem: Local Time is Ambiguous

```javascript
// What time is this REALLY?
const localTime = new Date('2024-11-03T01:30:00');
// In US Eastern timezone:
// 1:30 AM happens twice (EDT ends)
// Which one did we mean?

// JavaScript doesn't know!
console.log(localTime.getTime());  // Just a number, loses the context
```

## Case 1: The Ambiguous Hour (Fall Back)

When DST ends (usually November):

```
3:00 AM EDT → Clocks go back 1 hour → 2:00 AM EST
2:00-2:59 AM happens TWICE!

Timeline:
- 1:59:59 AM EDT
- 1:00:00 AM EST (1 hour earlier, same local time!)
- 1:59:59 AM EST
- 2:00:00 AM EST
```

### Why This Breaks Code

```javascript
// Logging: Which occurrence?
console.log('User logged in at 1:30 AM');  // First or second?

// Scheduling: Which occurrence should we run your job?
const runAt = new Date('2024-11-03T01:30:00');  // Ambiguous!

// Database: Can't distinguish between two events at 1:30 AM

// Interval timing: 30 minutes apart looks like 90 minutes
const start = new Date('2024-11-03T01:15:00');  // EDT
const end = new Date('2024-11-03T01:45:00');    // EST
console.log((end - start) / 1000 / 60);  // 90 minutes, not 30!
```

## Case 2: The Missing Hour (Spring Forward)

When DST begins (usually March):

```
1:59:59 AM EST → Clocks go forward 1 hour → 3:00:00 AM EDT
2:00-2:59 AM DOESN'T EXIST!

Timeline:
- 1:59:59 AM EST
- 3:00:00 AM EDT (1 hour forward, time jumped!)
- No 2:00-2:59 AM EDT
```

### Why This Breaks Code

```javascript
// Scheduling a meeting at 2:30 AM? Doesn't exist!
const meetingTime = new Date('2024-03-10T02:30:00');  // INVALID in this timezone

// Incrementing time by 1 second crosses DST boundary
const before = new Date('2024-03-10T01:59:59');
const after = new Date(before.getTime() + 1000);
// after is 3:00:00 AM, not 2:00:00 AM!

// Loop from 1 AM to 3 AM skips an hour
for (let hour = 1; hour <= 3; hour++) {
  const time = new Date(`2024-03-10T${hour.toString().padStart(2, '0')}:00:00`);
  console.log(time.toLocaleString());
}
// Outputs: 1 AM, 3 AM (skips 2 AM!)
```

## Case 3: The Buffer Zone (No Timezone Info)

JavaScript's Date doesn't store timezone:

```javascript
const dt = new Date('2024-11-03T01:30:00');
// Is this EDT or EST? No way to know!

// If you assume EST, you're wrong sometimes
// If you assume EDT, you're wrong other times
// If you don't assume, you lose the information

// ISO 8601 with offset:
const withOffset1 = new Date('2024-11-03T01:30:00-04:00');  // EDT
const withOffset2 = new Date('2024-11-03T01:30:00-05:00');  // EST
// Different times! (3.5 hours apart in UTC)

// But JavaScript doesn't give you a way to pick
```

## Real-World Failure: Google Calendar (2019)

Users in Australia were getting appointments on the wrong day.

```javascript
// The Bug:
// Google Calendar showed: "3:00 AM" in Australia
// But when DST ended, the internal time didn't adjust
// Meeting moved to 2:00 AM, then 1:00 AM → end of previous day!

// Why:
// Stored as local time: 3:00 AM (ambiguous)
// Didn't track which DST occurrence
// Rule change broke assumptions made months earlier
```

**Lesson:** Always store times in UTC or with explicit offset.

## Real-World Failure: Airbnb Booking Notifications (2016)

Users got vacation rental check-in reminders at wrong times.

```javascript
// Scheduled: "Notify 1 day before check-in at 9 AM local time"
// But check-in is 2024-03-09 (day before spring forward)
// When DST started, 9 AM moved to...? System confused

// Result: Notifications arrived at wrong time, guests missed check-ins
```

**Lesson:** Time-based scheduling must account for DST transitions in the target date.

## Real-World Failure: Financial Trading Systems (2019)

A trading system's scheduled batch job ran at wrong times.

```javascript
// Scheduled: "Run at 3:00 AM Eastern Time every day"
// During DST transition days:
// - 1 day has no 3 AM (spring forward)
// - 1 day has two 3 AMs (fall back)

// Result: Some trades weren't processed, others processed twice
```

**Lesson:** Cron jobs near DST boundaries need explicit handling.

## The IANA Timezone Database (TZDB)

The only authoritative source for DST rules:

```javascript
// Historical data: When did each timezone change to/from DST?
// Future predictions: When WILL timezones change?
// Special cases: Some countries changed, then changed back

// Example: US DST dates (changed in 2007):
// Before: 1st Sunday in April → 1st Sunday in October
// After:  2nd Sunday in March → 1st Sunday in November
// Affected all scheduling!

// You MUST use a library that queries TZDB
// JavaScript built-ins do NOT have this data
```

## 6 Common Mistakes with DST

### Mistake 1: Storing Local Time Without Offset

❌ **WRONG:**
```javascript
const meetingTime = new Date('2024-11-03T01:30:00');
// Is this UTC-4 or UTC-5? Unknown!
db.save({ meetingTime: '2024-11-03T01:30:00' });
// When DST ends, you won't know which occurrence this was
```

✅ **RIGHT:**
```javascript
// Store with offset
const utc = new Date('2024-11-03T01:30:00-04:00').toISOString();  // Always UTC
db.save({ meetingTime: utc });  // '2024-11-03T05:30:00Z'

// Or store offset explicitly
db.save({ 
  localTime: '2024-11-03T01:30:00',
  offset: '-04:00',
  tzName: 'America/New_York'
});
```

### Mistake 2: Assuming Intervals Are Constant

❌ **WRONG:**
```javascript
const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
// If DST transition happens in between, this isn't 1 hour in wall-clock time!
// During spring forward: might be 2 hours in clock time
// During fall back: might be zero hours in clock time
```

✅ **RIGHT:**
```javascript
// If you need wall-clock hours:
// Add 1 to the hour component, accounting for DST
function addClockHours(date, hours, tz) {
  // Check if DST changes between now and target
  // Adjust accordingly
}

// If you need actual elapsed time:
const elapsed = new Date(now.getTime() + 60 * 60 * 1000);  // This is correct for UTC
```

### Mistake 3: Scheduling Jobs Without Checking DST

❌ **WRONG:**
```javascript
// Run job every day at 2:30 AM Eastern Time
schedule.scheduleJob('0 30 2 * * *', job);  // Cron format
// Fails on spring forward (2:30 AM doesn't exist)
// Runs twice on fall back (ambiguous which run?)
```

✅ **RIGHT:**
```javascript
// Use a library that understands timezones
schedule.scheduleJob('0 30 9 * * *', () => {
  // Run in UTC, then convert to local time in destination timezone
  const now = new Date();
  const tz = 'America/New_York';
  
  // Check if this time exists in target timezone
  if (timeExistsInTimezone(new Date(), tz)) {
    job();
  }
});

// Or use explicit UTC scheduling
schedule.scheduleJob('0 30 13 * * *', job);  // 1:30 PM UTC = 8:30/9:30 AM ET
```

### Mistake 4: Comparing Times Across DST Boundaries

❌ **WRONG:**
```javascript
const eventTime = new Date('2024-11-03T01:30:00');
const now = new Date();

if (eventTime > now) {
  console.log('Event is in the future');
}
// But eventTime is ambiguous! Might be past or future depending on which 1:30 AM

```

✅ **RIGHT:**
```javascript
// Convert both to UTC before comparing
const eventTimeUtc = new Date('2024-11-03T01:30:00-04:00').getTime();
const nowUtc = new Date().getTime();

if (eventTimeUtc > nowUtc) {
  console.log('Event is in the future');
}
```

### Mistake 5: Iterating Through Hours During DST

❌ **WRONG:**
```javascript
for (let hour = 0; hour < 24; hour++) {
  const time = new Date(date);
  time.setHours(hour);
  console.log(time);
}
// During spring forward:
// Outputs hours 0-1, then jumps to 3-23 (skips hour 2!)
// During fall back:
// Outputs hours 0-1 twice (ambiguous!)
```

✅ **RIGHT:**
```javascript
// Iterate through UTC, convert to local
for (let i = 0; i < 24; i++) {
  const utcTime = new Date(date);
  utcTime.setUTCHours(i);
  const localTime = utcTime.toLocaleString('en-US', { timeZone: 'America/New_York' });
  console.log(localTime);  // Always valid
}
// Or use a library that handles this
```

### Mistake 6: Assuming Offset Doesn't Change

❌ **WRONG:**
```javascript
// Get offset at one point in time
const offset = new Date('2024-01-15').getTimezoneOffset();  // -300 (EST)
// Assume this applies to all dates in the year
const summerDate = new Date('2024-07-15');
console.log(summerDate.getTime() - summerDate.getTimezoneOffset() * 60000);
// Wrong! EDT offset is different (-240)
```

✅ **RIGHT:**
```javascript
// Always get offset for the specific date
const estimatedDate = new Date('2024-07-15');
const offset = estimatedDate.getTimezoneOffset();  // Get offset for that specific date
// Calculate accordingly
```

## 5 Real-World DST Disasters

### 1. Outlook Calendar (2007) - Post-Rule Change

When US changed DST dates in 2007:
- Outlook showed meetings at wrong times for 6 months
- Users missed important meetings
- Required major patch deployment

### 2. Stock Market Close Bells (Multiple Years)

Trading systems didn't account for DST:
- Market opened/closed at wrong times
- Trades executed outside regular hours
- Financial losses in millions

### 3. Australian Hospitals (2010)

When DST rule changed in one state but not others:
- Medication schedules were off by 1 hour
- Required emergency clinical procedure resets
- Patients received meds at wrong times

### 4. Bet365 Sportsbook (2020)

Betting system scheduled payouts based on local time:
- During DST transition, some bets paid twice
- Others not paid at all
- Had to refund entire betting sessions

### 5. Japan vs US DST Mismatch

Different DST transition dates cause issues:
- US: 2nd Sunday March
- Japan: No DST (but some Okinawa US bases do)
- Finance systems tracking both zones get confused
- Breaks international transactions

## Rules-Based DST Vs Historical

```javascript
// RULES-BASED: "DST starts 2nd Sunday in March"
const marchSecondSunday = findSecondSundayInMarch(2024);  // 2024-03-10

// HISTORICAL: "DST started on 1st Sunday in April until 2007"
const dstStartBefore2007 = '1st Sunday April';
const dstStartAfter2007 = '2nd Sunday March';

// The difference matters!
// A system deployed in 2005 that uses hard-coded "1st Sunday April" breaks in 2007

// IANA TZDB contains both rules and historical data:
// "US rule: 2nd Sunday March - 1st Sunday November (since 2007)"
// "US rule: 1st Sunday April - Last Sunday October (before 2007)"
```

## How to Handle DST Correctly

### Rule 1: Always Use UTC Internally

```javascript
// Store everything as UTC
db.save({ createdAt: new Date().toISOString() });  // '2024-03-15T14:30:00Z'

// When displaying to user:
const userTime = new Date(utcTime).toLocaleString('en-US', {
  timeZone: 'America/New_York',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit'
});
```

### Rule 2: Use a Library (Don't Reinvent Wheels)

```javascript
// GOOD: Use date-fns with tz, or day.js with timezone plugin
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';

const dstDate = new Date('2024-03-10T12:00:00Z');
const zonedDate = toZonedTime(dstDate, 'America/New_York');  // Knows about DST!

// BAD: Try to parse/calculate timezones yourself
const offset = new Date().getTimezoneOffset();  // Incomplete!
```

### Rule 3: Validate Dates Near DST Boundaries

```javascript
function isValidLocalTime(date, timeZone) {
  // Check if this local time actually exists in the given timezone
  // e.g., 2:30 AM doesn't exist on spring forward day
  
  const iso = date.toISOString();
  const local = new Date(iso).toLocaleString('en-US', { timeZone });
  
  // If timezone conversion gives different time, it was invalid/ambiguous
  return iso.includes(local);
}
```

### Rule 4: Store Timezone Context

```javascript
db.save({
  createdAt: new Date().toISOString(),  // UTC
  userTimeZone: 'America/New_York',      // For display
  // And if scheduling near DST boundaries:
  scheduledUtc: scheduledDateInUtc,
  scheduledTz: targetTimeZone,
  isDstBoundary: checkIfDstBoundary(scheduledDateInUtc, targetTimeZone)
});
```

### Rule 5: Test with DST Dates

```javascript
const dstDates = [
  new Date('2024-03-10'),  // Spring forward (2 AM missing)
  new Date('2024-11-03'),  // Fall back (2 AM ambiguous)
  new Date('2024-03-09'),  // Day before spring forward
  new Date('2024-11-04')   // Day after fall back
];

dstDates.forEach(date => {
  testScheduling(date);
  testIntervalCalculation(date);
  testDatabaseStorage(date);
});
```

## Implementation Checklist

- [ ] Store all timestamps as UTC (ISO 8601)
- [ ] Never store local time without explicit timezone
- [ ] Use date-fns-tz, day.js-tz, or Temporal API (when available)
- [ ] Test with DST transition dates (March 10 & November 3 in US)
- [ ] Don't assume offset is constant throughout the year
- [ ] Don't manually calculate DST transitions (use TZDB)
- [ ] Validate user input near DST boundaries
- [ ] Convert to user's timezone only for display
- [ ] Use UTC for all comparisons, calculations, storage
- [ ] Document timezone assumptions in your code
- [ ] Update timezone database annually

## Key Takeaway

DST is broken, but we're stuck with it. The only safe approach:
1. **Always use UTC internally**
2. **Always use a library** (don't calculate manually)
3. **Always test with DST dates**
4. **Always store timezone context** (for reference)

The JavaScript Date object doesn't know about DST. You must choose a library that does.
