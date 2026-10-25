# Module 23.5: DST-Aware Timezone Management

## 🎯 What You'll Learn

Master the nightmare of Daylight Saving Time (DST):
- **Ambiguous hours** - When clocks go back, the same time happens twice
- **Missing hours** - When clocks go forward, an hour doesn't exist
- **Scheduling across DST boundaries** - Why `cron` jobs break on DST days
- **Storing times correctly** - Always use UTC, never local time
- **Real-world disasters** - Google Calendar, Airbnb, stock trading systems, and more

---

## 🚀 Quick Start

### Installation

```bash
cd module-23-5-dst-aware-timezone
npm install
```

### Run Backend Server

```bash
npm start
# Server runs on http://localhost:5405
```

### Run React Frontend

In another terminal:

```bash
npm run dev:react
# Open http://localhost:3000 → goes to Module 23.5
```

---

## 📚 The DST Problem in 90 Seconds

### Spring Forward (March 10, 2024 at 2:00 AM)

```
1:59:59 AM EST → 3:00:00 AM EDT
2:00-2:59 AM DOES NOT EXIST!

❌ Try to schedule a 2:30 AM task? ERROR!
❌ Parse "2024-03-10T02:30:00"? Ambiguous!
```

### Fall Back (November 3, 2024 at 2:00 AM)

```
1:59:59 AM EDT → 1:00:00 AM EST
1:00-1:59 AM HAPPENS TWICE!

⚠️ Event logged at 1:30 AM—which occurrence?
⚠️ Payment processed at 1:30 AM—is it duplicate?
```

### Why JavaScript Fails

```javascript
const time = new Date('2024-11-03T01:30:00');
// Which 1:30 AM? EDT or EST? NO WAY TO KNOW!

// Add 1 hour
const later = new Date(time.getTime() + 60 * 60 * 1000);
// Looks like 2:30 AM, but is it EDT or EST?
// What if the boundary was crossed?
```

---

## 🔨 API Reference

### Endpoints

#### `GET /api/health`

Server status check.

---

#### `GET /api/dst-info/:date/:timezone`

Check if a date is a DST transition date.

**URL:** `GET /api/dst-info/2024-03-10/America/New_York`

**Response:**
```json
{
  "date": "2024-03-10",
  "timezone": "America/New_York",
  "isDSTTransition": true,
  "offset": -240
}
```

---

#### `POST /api/check-time-exists`

Verify if a local time actually exists (handles DST gaps/ambiguities).

**Body:**
```json
{
  "dateTime": "2024-03-10T02:30:00",
  "timezone": "America/New_York"
}
```

**Response:**
```json
{
  "dateTime": "2024-03-10T02:30:00",
  "timezone": "America/New_York",
  "exists": false,
  "note": "Invalid or ambiguous time during DST transition"
}
```

---

#### `GET /api/dst-boundaries/:year/:timezone`

Get DST transition dates for the entire year.

**URL:** `GET /api/dst-boundaries/2024/America/New_York`

**Response:**
```json
{
  "year": 2024,
  "timezone": "America/New_York",
  "springForward": {
    "date": "2024-03-10",
    "time": "2:00 AM → 3:00 AM",
    "type": "Spring Forward (gap)",
    "hoursLost": 1,
    "description": "2:00-2:59 AM does NOT exist"
  },
  "fallBack": {
    "date": "2024-11-03",
    "time": "2:00 AM → 1:00 AM",
    "type": "Fall Back (ambiguous)",
    "hoursGained": 1,
    "description": "2:00-2:59 AM happens TWICE"
  }
}
```

---

#### `POST /api/add-hours`

Safely add hours accounting for DST transitions.

**Body:**
```json
{
  "startTime": "2024-03-10T01:00:00Z",
  "hoursToAdd": 3,
  "timezone": "America/New_York"
}
```

**Response:**
```json
{
  "startTime": "2024-03-10T01:00:00Z",
  "hoursAdded": 3,
  "timezone": "America/New_York",
  "result": {
    "before": "2024-03-10T01:00:00Z",
    "after": "2024-03-10T04:00:00Z",
    "crossedDST": true
  }
}
```

---

#### `GET /api/ambiguous-times/:date/:timezone`

Show all times that occur twice during fall back.

**URL:** `GET /api/ambiguous-times/2024-11-03/America/New_York`

**Response:**
```json
{
  "date": "2024-11-03",
  "timezone": "America/New_York",
  "type": "Ambiguous times (occur twice during fall back)",
  "times": [
    {
      "local": "01:00:00",
      "utc": "2024-11-03T05:00:00Z",
      "index": 1,
      "note": "Which occurrence? This is ambiguous during fall back"
    }
  ]
}
```

---

#### `GET /api/missing-times/:date/:timezone`

Show all times that don't exist during spring forward.

**URL:** `GET /api/missing-times/2024-03-10/America/New_York`

**Response:**
```json
{
  "date": "2024-03-10",
  "timezone": "America/New_York",
  "type": "Missing times (do not exist during spring forward)",
  "times": [
    {
      "local": "02:00:00",
      "existsIn": "UTC only",
      "note": "This time does NOT exist in this timezone (spring forward)"
    }
  ]
}
```

---

#### `POST /api/schedule-task`

Schedule a task with DST safety check.

**Body:**
```json
{
  "taskName": "Database backup",
  "scheduledTime": "2024-03-10T02:30:00",
  "timezone": "America/New_York"
}
```

**Response:**
```json
{
  "taskName": "Database backup",
  "scheduledTime": "2024-03-10T02:30:00Z",
  "timezone": "America/New_York",
  "isDSTBoundary": true,
  "warning": "⚠️ This time is near a DST boundary - verify scheduling",
  "recommendation": "Use explicit UTC time instead of local time for critical tasks"
}
```

---

#### `GET /api/timezones`

List all supported timezones.

**Response:**
```json
{
  "timezones": [
    "America/New_York",
    "America/Chicago",
    "Europe/London",
    "Asia/Tokyo",
    ...
  ]
}
```

---

## 🤦 6 Common Mistakes (and How to Fix Them)

### Mistake 1: Storing Local Time Without Offset

❌ **WRONG:**
```javascript
db.save({ eventTime: '2024-11-03T01:30:00' });
// Is this the first or second 1:30 AM? Unknown!
// Can't distinguish between duplicate times
```

✅ **RIGHT:**
```javascript
// Store in UTC
db.save({ eventTime: new Date('2024-11-03T01:30:00').toISOString() });
// Or with explicit offset
db.save({ 
  eventTime: '2024-11-03T01:30:00-04:00',  // EDT
  tzName: 'America/New_York'
});
```

---

### Mistake 2: Scheduling Jobs Near DST Boundaries

❌ **WRONG:**
```javascript
// Cron job: "Run at 2:30 AM every day"
schedule.scheduleJob('0 30 2 * * *', dailyJob);
// Breaks on spring forward (2:30 AM doesn't exist)
// Runs twice on fall back (ambiguous which execution?)
```

✅ **RIGHT:**
```javascript
// Schedule in UTC, convert to display timezone
schedule.scheduleJob('0 30 13 * * *', () => {
  // 1:30 PM UTC = 8:30/9:30 AM ET (depending on DST)
  // But always 1 execution per day in UTC
  dailyJob();
});

// Or explicitly check DST
if (isDSTBoundary(scheduledTime, timezone)) {
  logger.warn('Scheduled near DST—use UTC times for reliability');
}
```

---

### Mistake 3: Assuming Offset is Constant

❌ **WRONG:**
```javascript
const offset = new Date('2024-01-15').getTimezoneOffset();
// EST: -300 minutes (-5 hours)

// WRONG: Use this offset for summer dates
const summer = new Date('2024-07-15');
const utc = summer.getTime() - offset * 60 * 1000;
// Wrong! EDT offset is -240, not -300
```

✅ **RIGHT:**
```javascript
// Always get offset for the specific date
function getOffsetForDate(date, timezone) {
  return new Date(date).getTimezoneOffset();  // For that date!
}

// Or use Intl API (which handles DST)
new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/New_York'
}).format(specificDate);
```

---

### Mistake 4: Adding Hours to Local Time

❌ **WRONG:**
```javascript
const time = new Date('2024-03-09T23:00:00');
const later = new Date(time.getTime() + 3 * 60 * 60 * 1000);
// Looks like adding 3 hours, but if DST crosses...
// Wall-clock time might change by 2 hours instead!
```

✅ **RIGHT:**
```javascript
// Work in UTC, then convert
const timeUtc = new Date('2024-03-09T23:00:00Z');
const laterUtc = new Date(timeUtc.getTime() + 3 * 60 * 60 * 1000);
// 3 hours elapsed time → always 3 hours in UTC

// To display: convert later to user's timezone
const display = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/New_York'
}).format(laterUtc);
```

---

### Mistake 5: Iterating Through Hours on DST Day

❌ **WRONG:**
```javascript
for (let hour = 0; hour < 24; hour++) {
  const time = new Date(date);
  time.setHours(hour);
  console.log(time);
}
// On spring forward: skips hour 2 (doesn't exist)
// On fall back: shows hour 1 twice (ambiguous)
```

✅ **RIGHT:**
```javascript
// Iterate through UTC, convert to local
for (let i = 0; i < 24; i++) {
  const utcTime = new Date(date);
  utcTime.setUTCHours(i);
  const local = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York'
  }).format(utcTime);
  console.log(local);  // Always valid, no gaps
}
```

---

### Mistake 6: Assuming Time Differences Are Linear

❌ **WRONG:**
```javascript
const interval = (end - start) / 1000 / 60;  // minutes
// If DST crossed, this doesn't match wall-clock time!
// During spring forward: might be -60 minutes!
```

✅ **RIGHT:**
```javascript
// For elapsed time (UTC), this is fine
const elapsedMs = endUtc - startUtc;

// For wall-clock time, must account for DST
function getWallClockMinutes(startUtc, endUtc, timezone) {
  const startLocal = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  }).format(new Date(startUtc));
  
  const endLocal = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  }).format(new Date(endUtc));
  
  // Parse and compare local times
  return calculateDifference(startLocal, endLocal);
}
```

---

## 💥 5 Real-World DST Disasters

### 1. **Google Calendar (2019) - Wrong Day for Meetings**

Users in Australia got appointments on the wrong days during DST rule changes.

**What went wrong:**
- Stored meeting as: "3:00 AM" (local, no offset)
- When DST ended 1 hour early than expected, internal time adjusted
- 3:00 AM became 2:00 AM, then 1:00 AM
- Meeting crossed into the previous day

**Lesson:** Always store with explicit offset or UTC.

---

### 2. **Airbnb Booking Notifications (2016)**

Check-in reminders arrived at wrong times on DST days.

**What went wrong:**
- Scheduled: "Notify 1 day before check-in at 9 AM local time"
- Check-in was on March 9 (day before spring forward)
- System didn't account for DST shift on the scheduled notification date
- Notifications arrived at 8 AM or 10 AM, not 9 AM

**Lesson:** Time-based scheduling must account for DST in BOTH dates.

---

### 3. **Stock Market Trading (2019)**

Batch jobs ran at wrong times on DST days, missing trade deadlines.

**What went wrong:**
- Scheduled: "Run at 3:00 AM Eastern Time"
- Spring forward: 3:00 AM didn't exist (skipped to 4:00 AM)
- Fall back: 3:00 AM happened twice
- Some trades processed late, others processed twice

**Lesson:** Cron jobs must validate DST boundaries.

---

### 4. **Bet365 Sportsbook (2020)**

Betting payouts errored during DST transition.

**What went wrong:**
- During fall back, a payout scheduled for 1:30 AM ran twice
- Once for the first 1:30 AM (EDT)
- Once for the second 1:30 AM (EST)
- Customers were paid twice for the same bet

**Lesson:** Idempotency keys MUST account for DST ambiguity.

---

### 5. **Israel Timezone Rule Changes (2013)**

A country decided to start DST on a different date, breaking every system.

**What went wrong:**
- Historically, DST started first Thursday of April
- One year, they moved it to first Sunday of March
- Systems that hard-coded the old rule expected DST 2 months later
- Caused scheduling failures, conference call failures, billing errors

**Lesson:** Never hard-code DST rules. Always use IANA TZDB.

---

## ✨ Best Practices for DST Handling

### Rule 1: **Always Store Times as UTC**

```javascript
// Good
db.save({ createdAt: new Date().toISOString() });  // '2024-03-10T14:30:00Z'

// Bad
db.save({ createdAt: '2024-03-10 02:30:00' });  // Ambiguous!
```

### Rule 2: **Use a Library, Not Manual Calculation**

```javascript
// Good: date-fns-tz, day.js-tz, temporal API
import { formatInTimeZone } from 'date-fns-tz';

// Bad: DIY offset calculation
const offset = new Date().getTimezoneOffset();  // Incomplete!
```

### Rule 3: **Test With DST Dates**

```javascript
const testDates = [
  '2024-03-10',  // Spring forward
  '2024-03-09',  // Day before
  '2024-11-03',  // Fall back
  '2024-11-04'   // Day after
];

testDates.forEach(date => {
  testScheduling(date);
  testCalculations(date);
  testStorage(date);
});
```

### Rule 4: **Store Timezone Context**

```javascript
db.save({
  eventTime: '2024-11-03T01:30:00Z',     // UTC
  userTimeZone: 'America/New_York',       // For display
  isDSTBoundary: true,                   // Flag for validation
  originalOffset: '-04:00'               // Reference
});
```

### Rule 5: **Validate Before Scheduling**

```javascript
function scheduleTask(taskName, localTime, timezone) {
  const d = new Date(localTime);
  
  if (isDSTGap(d, timezone)) {
    throw new Error(`${d} does not exist in ${timezone}`);
  }
  
  if (isDSTAmbiguous(d, timezone)) {
    logger.warn(`${d} is ambiguous in ${timezone}—use UTC`);
  }
  
  // Proceed with scheduling in UTC
  scheduleInUtc(taskName, d, timezone);
}
```

---

## 🧪 Testing Your Code

```javascript
// Test DST handling
const tests = {
  'Spring forward gap': () => {
    const time = new Date('2024-03-10T02:30:00');
    assert(!timeExists(time, 'America/New_York'));
  },
  
  'Fall back ambiguity': () => {
    const time1 = new Date('2024-11-03T01:30:00-04:00');  // EDT
    const time2 = new Date('2024-11-03T01:30:00-05:00');  // EST
    assert.notEqual(time1.getTime(), time2.getTime());
  },
  
  'Add hours across DST': () => {
    const before = new Date('2024-03-09T23:00:00Z');
    const after = new Date(before.getTime() + 3 * 60 * 60 * 1000);
    assert(isDSTTransitioning(before, after, 'America/New_York'));
  }
};

Object.entries(tests).forEach(([name, test]) => {
  try {
    test();
    console.log(`✅ ${name}`);
  } catch (e) {
    console.log(`❌ ${name}: ${e.message}`);
  }
});
```

---

## 🎓 Further Reading

- [Time Zone Database (IANA TZDB)](https://www.iana.org/assignments/tzdb-country-code/tzdb-country-code.xhtml)
- [NIST: The History of Daylight Saving Time](https://www.nist.gov/pml/time-and-frequency-division/popular-links/daylight-saving-time)
- [date-fns-tz Documentation](https://date-fns.org/docs/Getting-Started/bestPractices)
- [Temporal API Proposal](https://tc39.es/proposal-temporal/)
- [The Unique Challenge of Daylight Saving Time (Stack Overflow Blog)](https://stackoverflow.blog/2021/05/13/best-practices-with-dates-and-times/)

---

## Implementation Checklist

- [ ] All timestamps stored as UTC (ISO 8601)
- [ ] Never store local time without offset
- [ ] Scheduled tasks validated for DST boundaries
- [ ] Office hours/business logic accounts for DST
- [ ] Cron jobs tested on DST dates
- [ ] Database timestamps use UTC
- [ ] Time arithmetic done in UTC
- [ ] Display times converted from UTC per user timezone
- [ ] Tests include March 10 and November 3 dates
- [ ] No hard-coded DST rules (use TZDB)
- [ ] Team aware of DST gotchas
- [ ] Incident response plan for DST bugs

---

**The Golden Rule:** 

> *Store everything in UTC. Convert to local time only for display. Never do math on local time.*

## Common mistakes

## Real world usage
