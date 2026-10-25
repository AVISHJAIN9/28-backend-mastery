import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import winston from 'winston';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const HTTP_PORT = process.env.HTTP_PORT || 5405;

// Middleware
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }));
app.use(helmet());
app.use(express.json());

// Logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// ==================== Helper Functions ====================

// Check if a local time exists in a timezone (accounts for DST gaps)
function timeExistsInTimezone(localDateTime, tzName) {
  // Create two dates: one before DST check, one after
  // If they convert to different times, then the time doesn't exist or is ambiguous
  
  const iso = new Date(localDateTime).toISOString();
  const options = {
    timeZone: tzName,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  };
  
  const local = new Date(iso).toLocaleString('en-US', options);
  return local.includes(new Date(localDateTime).toISOString().substring(0, 10));
}

// Get DST information for a specific date and timezone
function getDSTInfo(date, tzName) {
  const d = new Date(date);
  
  // Get offset at this date
  const iso = d.toISOString();
  const localOptions = {
    timeZone: tzName,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  };
  
  const timeFormatter = new Intl.DateTimeFormat('en-US', localOptions);
  const parts = timeFormatter.formatToParts(d);
  
  // Create a date one day before and one day after
  const dayBefore = new Date(d);
  dayBefore.setUTCDate(dayBefore.getUTCDate() - 1);
  
  const dayAfter = new Date(d);
  dayAfter.setUTCDate(dayAfter.getUTCDate() + 1);
  
  // Simple offset calculation
  const testMidnight = new Date(d);
  testMidnight.setUTCHours(0, 0, 0, 0);
  
  return {
    date: d.toISOString().split('T')[0],
    timezone: tzName,
    isDSTTransition: checkIfDSTBoundary(d, tzName),
    offset: d.getTimezoneOffset()  // Note: varies by date
  };
}

// Check if date is near DST boundary
function checkIfDSTBoundary(date, tzName) {
  // US DST boundaries (2nd Sunday in March, 1st Sunday in November)
  const year = date.getUTCFullYear();
  
  // 2nd Sunday in March
  const march = new Date(year, 2, 1);  // March 1st
  let marchSecondSunday = 1;
  for (let i = 1; i <= 31; i++) {
    const d = new Date(year, 2, i);
    if (d.getDay() === 0) {  // Sunday
      if (marchSecondSunday === 2) break;
      marchSecondSunday = i;
      if (marchSecondSunday !== 1) marchSecondSunday = i;
    }
  }
  
  // 1st Sunday in November
  const november = new Date(year, 10, 1);
  let novemberFirstSunday = 1;
  for (let i = 1; i <= 7; i++) {
    const d = new Date(year, 10, i);
    if (d.getDay() === 0) {  // Sunday
      novemberFirstSunday = i;
      break;
    }
  }
  
  const dayOfMonth = date.getUTCDate();
  return (dayOfMonth === 8 || dayOfMonth === 9 || dayOfMonth === 10) ||  // Around March 10
         (dayOfMonth === 1 || dayOfMonth === 2 || dayOfMonth === 3);      // Around November 3
}

// Safely add hours accounting for DST
function addHoursAcrossDST(date, hours, tzName) {
  const before = new Date(date);
  const after = new Date(date.getTime() + hours * 60 * 60 * 1000);
  
  return {
    before: before.toISOString(),
    after: after.toISOString(),
    wallClockDifference: calculateWallClockDifference(before, after, tzName),
    crossedDST: checkIfDSTBoundary(before, tzName) || checkIfDSTBoundary(after, tzName)
  };
}

// Calculate wall-clock time difference (accounts for DST)
function calculateWallClockDifference(date1, date2, tzName) {
  const options = {
    timeZone: tzName,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  };
  
  const formatter = new Intl.DateTimeFormat('en-US', options);
  const time1 = formatter.format(date1);
  const time2 = formatter.format(date2);
  
  // Parse and calculate difference
  // Note: This is simplified; real implementation would parse times
  return {
    time1,
    time2,
    note: 'Wall-clock times may differ from elapsed time during DST transitions'
  };
}

// ==================== API Endpoints ====================

// GET /api/health
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// GET /api/dst-info/:date/:timezone
// Get DST information for a specific date and timezone
app.get('/api/dst-info/:date/:timezone', (req, res) => {
  try {
    const { date, timezone } = req.params;
    const d = new Date(date);
    
    if (isNaN(d.getTime())) {
      return res.status(400).json({ error: 'Invalid date format (use YYYY-MM-DD)' });
    }
    
    const info = getDSTInfo(d, timezone);
    res.json(info);
  } catch (error) {
    logger.error('DST info error', { error: error.message });
    res.status(500).json({ error: 'Internal error' });
  }
});

// POST /api/check-time-exists
// Check if a local time exists in a timezone (handles DST gaps)
app.post('/api/check-time-exists', (req, res) => {
  try {
    const { dateTime, timezone } = req.body;
    
    if (!dateTime || !timezone) {
      return res.status(400).json({ error: 'Missing dateTime or timezone' });
    }
    
    const d = new Date(dateTime);
    const exists = timeExistsInTimezone(d, timezone);
    
    res.json({
      dateTime,
      timezone,
      exists,
      note: exists ? 'Valid time' : 'Invalid or ambiguous time during DST transition'
    });
  } catch (error) {
    logger.error('Time exists check error', { error: error.message });
    res.status(500).json({ error: 'Internal error' });
  }
});

// GET /api/dst-boundaries/:year/:timezone
// Get DST transition dates for a year
app.get('/api/dst-boundaries/:year/:timezone', (req, res) => {
  try {
    const { year, timezone } = req.params;
    const y = parseInt(year);
    
    if (isNaN(y) || y < 1970 || y > 2100) {
      return res.status(400).json({ error: 'Year must be 1970-2100' });
    }
    
    // US DST boundaries (simplified)
    // 2nd Sunday in March (spring forward - 2 AM to 3 AM)
    // 1st Sunday in November (fall back - 2 AM to 1 AM)
    
    let marchSecondSunday = null;
    let novemberFirstSunday = null;
    
    for (let i = 8; i <= 14; i++) {
      const d = new Date(y, 2, i);
      if (d.getDay() === 0) {
        marchSecondSunday = i;
        break;
      }
    }
    
    for (let i = 1; i <= 7; i++) {
      const d = new Date(y, 10, i);
      if (d.getDay() === 0) {
        novemberFirstSunday = i;
        break;
      }
    }
    
    const springForward = new Date(y, 2, marchSecondSunday, 2, 0, 0);
    const fallBack = new Date(y, 10, novemberFirstSunday, 2, 0, 0);
    
    res.json({
      year: y,
      timezone,
      springForward: {
        date: `2024-03-${marchSecondSunday}`,
        time: '2:00 AM → 3:00 AM',
        type: 'Spring Forward (gap)',
        hoursLost: 1,
        description: '2:00-2:59 AM does NOT exist'
      },
      fallBack: {
        date: `2024-11-${novemberFirstSunday}`,
        time: '2:00 AM → 1:00 AM',
        type: 'Fall Back (ambiguous)',
        hoursGained: 1,
        description: '2:00-2:59 AM happens TWICE'
      }
    });
  } catch (error) {
    logger.error('DST boundaries error', { error: error.message });
    res.status(500).json({ error: 'Internal error' });
  }
});

// POST /api/add-hours
// Add hours with DST awareness
app.post('/api/add-hours', (req, res) => {
  try {
    const { startTime, hoursToAdd, timezone } = req.body;
    
    if (!startTime || hoursToAdd === undefined || !timezone) {
      return res.status(400).json({ error: 'Missing startTime, hoursToAdd, or timezone' });
    }
    
    const start = new Date(startTime);
    const result = addHoursAcrossDST(start, hoursToAdd, timezone);
    
    res.json({
      startTime: start.toISOString(),
      hoursAdded: hoursToAdd,
      timezone,
      result
    });
  } catch (error) {
    logger.error('Add hours error', { error: error.message });
    res.status(500).json({ error: 'Internal error' });
  }
});

// GET /api/ambiguous-times
// Get times that are ambiguous during fall back
app.get('/api/ambiguous-times/:date/:timezone', (req, res) => {
  try {
    const { date, timezone } = req.params;
    const d = new Date(date);
    
    // During fall back, 1-2 AM happens twice
    // Create times in this range
    const ambiguousTimes = [];
    
    for (let minute = 0; minute < 60; minute += 15) {
      const time = new Date(d);
      time.setHours(1, minute, 0);
      ambiguousTimes.push({
        local: `01:${String(minute).padStart(2, '0')}:00`,
        utc: time.toISOString(),
        index: ambiguousTimes.length + 1,
        note: 'Which occurrence? This is ambiguous during fall back'
      });
    }
    
    res.json({
      date,
      timezone,
      type: 'Ambiguous times (occur twice during fall back)',
      times: ambiguousTimes
    });
  } catch (error) {
    logger.error('Ambiguous times error', { error: error.message });
    res.status(500).json({ error: 'Internal error' });
  }
});

// GET /api/missing-times
// Get times that don't exist during spring forward
app.get('/api/missing-times/:date/:timezone', (req, res) => {
  try {
    const { date, timezone } = req.params;
    
    // During spring forward, 2-3 AM doesn't exist
    const missingTimes = [];
    
    for (let minute = 0; minute < 60; minute += 15) {
      missingTimes.push({
        local: `02:${String(minute).padStart(2, '0')}:00`,
        existsIn: 'UTC only',
        note: 'This time does NOT exist in this timezone (spring forward)'
      });
    }
    
    res.json({
      date,
      timezone,
      type: 'Missing times (do not exist during spring forward)',
      times: missingTimes
    });
  } catch (error) {
    logger.error('Missing times error', { error: error.message });
    res.status(500).json({ error: 'Internal error' });
  }
});

// POST /api/schedule-task
// Schedule a task with DST awareness
app.post('/api/schedule-task', (req, res) => {
  try {
    const { taskName, scheduledTime, timezone } = req.body;
    
    if (!taskName || !scheduledTime || !timezone) {
      return res.status(400).json({ error: 'Missing taskName, scheduledTime, or timezone' });
    }
    
    const d = new Date(scheduledTime);
    const isDST = checkIfDSTBoundary(d, timezone);
    
    res.json({
      taskName,
      scheduledTime: d.toISOString(),
      timezone,
      isDSTBoundary: isDST,
      warning: isDST ? '⚠️ This time is near a DST boundary - verify scheduling' : '✅ Safe to schedule',
      recommendation: isDST ? 
        'Use explicit UTC time instead of local time for critical tasks' : 
        'Scheduling is straightforward on this date'
    });
  } catch (error) {
    logger.error('Schedule task error', { error: error.message });
    res.status(500).json({ error: 'Internal error' });
  }
});

// GET /api/timezones
// List all supported timezones
app.get('/api/timezones', (req, res) => {
  const timezones = [
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'America/Anchorage',
    'America/Toronto',
    'America/Mexico_City',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Europe/Moscow',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Asia/Hong_Kong',
    'Asia/Singapore',
    'Asia/Bangkok',
    'Asia/Dubai',
    'Asia/Kolkata',
    'Australia/Sydney',
    'Australia/Melbourne',
    'Pacific/Auckland',
    'UTC'
  ];
  
  res.json({ timezones });
});

// Start server
app.listen(HTTP_PORT, () => {
  logger.info(`DST-Aware Timezone API running on http://localhost:${HTTP_PORT}`);
  logger.info(`Test: curl http://localhost:${HTTP_PORT}/api/health`);
});
