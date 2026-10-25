const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const winston = require('winston');

const app = express();
const HTTP_PORT = process.env.HTTP_PORT || 5401;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// ============= TIMEZONE UTILITIES =============

/**
 * Convert UTC timestamp to multiple timezones
 */
function formatInMultipleZones(unixTimestampSeconds) {
  const utcDate = new Date(unixTimestampSeconds * 1000);
  
  const zones = {
    'UTC': { offset: 0, abbr: 'UTC' },
    'America/New_York': { offset: -5, abbr: 'EST', dstAbbr: 'EDT' },
    'America/Los_Angeles': { offset: -8, abbr: 'PST', dstAbbr: 'PDT' },
    'Europe/London': { offset: 0, abbr: 'GMT', dstAbbr: 'BST' },
    'Europe/Paris': { offset: 1, abbr: 'CET', dstAbbr: 'CEST' },
    'Asia/Tokyo': { offset: 9, abbr: 'JST' },
    'Australia/Sydney': { offset: 10, abbr: 'AEDT', dstAbbr: 'AEST' },
    'Asia/Kolkata': { offset: 5.5, abbr: 'IST' }
  };
  
  const result = {};
  
  for (const [zone, info] of Object.entries(zones)) {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: zone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    
    result[zone] = {
      formatted: formatter.format(utcDate),
      offset: info.offset,
      abbr: info.abbr,
      dstAbbr: info.dstAbbr
    };
  }
  
  return result;
}

/**
 * Get Unix timestamp from ISO 8601 string
 */
function parseISO8601(isoString) {
  const date = new Date(isoString);
  return Math.floor(date.getTime() / 1000);
}

/**
 * Convert Unix timestamp to ISO 8601 UTC
 */
function toISO8601UTC(unixTimestampSeconds) {
  const date = new Date(unixTimestampSeconds * 1000);
  return date.toISOString();
}

/**
 * Check if date is in DST for a timezone
 */
function isDST(unixTimestampSeconds, timezone) {
  const date = new Date(unixTimestampSeconds * 1000);
  
  // Compare offset in January (standard time) vs current month
  const january = new Date(date.getFullYear(), 0, 1);
  const janFormatter = new Intl.DateTimeFormat('en-US', { 
    timeZone: timezone, 
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  
  const currentFormatter = new Intl.DateTimeFormat('en-US', { 
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  
  // If date is in DST, offset will be different
  const janOffset = january.getTimezoneOffset();
  const currentOffset = date.getTimezoneOffset();
  
  return janOffset !== currentOffset;
}

/**
 * Calculate seconds until midnight in user's timezone
 */
function secondsUntilMidnight(unixTimestampSeconds, timezone) {
  const date = new Date(unixTimestampSeconds * 1000);
  
  // Get current date string in user's timezone
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  
  const parts = formatter.formatToParts(date);
  const year = parts.find(p => p.type === 'year').value;
  const month = parts.find(p => p.type === 'month').value;
  const day = parts.find(p => p.type === 'day').value;
  
  // Create midnight tomorrow in UTC, then adjust
  const nextDay = new Date(`${year}-${month}-${day}T23:59:59Z`);
  const secondsUntilEOD = Math.ceil((nextDay - date) / 1000);
  
  return secondsUntilEOD;
}

// ============= ENDPOINTS =============

/**
 * GET /api/now
 * Get current time in all timezones
 */
app.get('/api/now', (req, res) => {
  const now = Math.floor(Date.now() / 1000);
  
  try {
    res.json({
      timestamp: now,
      iso8601UTC: toISO8601UTC(now),
      zones: formatInMultipleZones(now),
      meta: {
        message: 'Current time in UTC and multiple timezones',
        allUTC: 'Every moment has exactly one representation'
      }
    });
  } catch (error) {
    logger.error('Error in /api/now', { error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/convert?iso=2026-03-29T12:00:00Z
 * Convert any ISO 8601 to multiple timezones
 */
app.get('/api/convert', (req, res) => {
  try {
    const { iso } = req.query;
    
    if (!iso) {
      return res.status(400).json({ error: 'Missing iso parameter' });
    }
    
    const timestamp = parseISO8601(iso);
    
    if (isNaN(timestamp)) {
      return res.status(400).json({ error: 'Invalid ISO 8601 format' });
    }
    
    res.json({
      input: iso,
      timestamp,
      zones: formatInMultipleZones(timestamp),
      meta: {
        message: 'Single moment shown in multiple timezones',
        note: 'All times represent the exact same instant'
      }
    });
  } catch (error) {
    logger.error('Error in /api/convert', { error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/timezone/:tz?timestamp=1711756800
 * Get current time in specific timezone
 */
app.get('/api/timezone/:tz', (req, res) => {
  try {
    const { tz } = req.params;
    const { timestamp } = req.query;
    
    const unixTs = timestamp ? parseInt(timestamp) : Math.floor(Date.now() / 1000);
    
    if (isNaN(unixTs)) {
      return res.status(400).json({ error: 'Invalid timestamp' });
    }
    
    const date = new Date(unixTs * 1000);
    
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    
    const formatted = formatter.format(date);
    const isDaylightSaving = isDST(unixTs, tz);
    const secondsUntilMid = secondsUntilMidnight(unixTs, tz);
    
    res.json({
      timezone: tz,
      timestamp: unixTs,
      iso8601UTC: toISO8601UTC(unixTs),
      formatted,
      isDST: isDaylightSaving,
      secondsUntilMidnight: secondsUntilMid,
      hoursUntilMidnight: (secondsUntilMid / 3600).toFixed(2)
    });
  } catch (error) {
    logger.error('Error in /api/timezone/:tz', { error });
    res.status(500).json({ error: 'Invalid timezone or error processing' });
  }
});

/**
 * GET /api/dst-info?year=2026
 * Get DST transitions for a year in specific timezone
 */
app.get('/api/dst-info', (req, res) => {
  try {
    const { year = 2026, tz = 'America/New_York' } = req.query;
    const y = parseInt(year);
    
    if (isNaN(y) || y < 1970 || y > 2100) {
      return res.status(400).json({ error: 'Invalid year' });
    }
    
    // For US, DST typically Spring Forwards March 2nd, Fall Back Nov 1st
    // These vary by location
    
    const transitions = {
      'America/New_York': [
        {
          type: 'spring-forward',
          date: new Date(`${y}-03-09T07:00:00Z`), // 2:00 AM EST → 3:00 AM EDT
          from: 'EST',
          to: 'EDT',
          note: '2:00 AM becomes 3:00 AM (skip 1 hour)'
        },
        {
          type: 'fall-back',
          date: new Date(`${y}-11-02T06:00:00Z`), // 2:00 AM EDT → 1:00 AM EST
          from: 'EDT',
          to: 'EST',
          note: '2:00 AM becomes 1:00 AM (repeat 1 hour)'
        }
      ],
      'Europe/London': [
        {
          type: 'spring-forward',
          date: new Date(`${y}-03-30T01:00:00Z`), // 1:00 AM GMT → 2:00 AM BST
          from: 'GMT',
          to: 'BST',
          note: 'Clocks spring forward'
        },
        {
          type: 'fall-back',
          date: new Date(`${y}-10-27T02:00:00Z`), // 2:00 AM BST → 1:00 AM GMT
          from: 'BST',
          to: 'GMT',
          note: 'Clocks fall back'
        }
      ]
    };
    
    const tzTransitions = transitions[tz] || [];
    
    res.json({
      year: y,
      timezone: tz,
      transitions: tzTransitions.map(t => ({
        type: t.type,
        iso8601UTC: t.date.toISOString(),
        timestampUTC: Math.floor(t.date.getTime() / 1000),
        from: t.from,
        to: t.to,
        note: t.note
      })),
      explanation: 'DST transitions happen at different times in different zones'
    });
  } catch (error) {
    logger.error('Error in /api/dst-info', { error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/schedule-task
 * Schedule task for specific time in user's timezone
 */
app.post('/api/schedule-task', (req, res) => {
  try {
    const { hour, minute, timezone } = req.body;
    
    if (hour === undefined || minute === undefined || !timezone) {
      return res.status(400).json({ error: 'Missing hour, minute, or timezone' });
    }
    
    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
      return res.status(400).json({ error: 'Invalid hour or minute' });
    }
    
    // Find next occurrence of this time in user's timezone
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    
    const parts = formatter.formatToParts(now);
    const todayYear = parts.find(p => p.type === 'year').value;
    const todayMonth = parts.find(p => p.type === 'month').value;
    const todayDay = parts.find(p => p.type === 'day').value;
    const currentHour = parseInt(parts.find(p => p.type === 'hour').value);
    const currentMinute = parseInt(parts.find(p => p.type === 'minute').value);
    
    // Rough calculation (doesn't account for DST transitions perfectly)
    let scheduledDate = new Date(`${todayYear}-${todayMonth}-${todayDay}T${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`);
    
    if (hour < currentHour || (hour === currentHour && minute <= currentMinute)) {
      // Schedule for tomorrow
      scheduledDate = new Date(scheduledDate.getTime() + 24 * 60 * 60 * 1000);
    }
    
    const scheduledUnixTime = Math.floor(scheduledDate.getTime() / 1000);
    const secondsFromNow = Math.floor((scheduledDate - now) / 1000);
    
    res.json({
      scheduled: {
        time: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
        timezone,
        iso8601UTC: scheduledDate.toISOString(),
        unixTimestamp: scheduledUnixTime
      },
      scheduling: {
        secondsFromNow,
        minutesFromNow: (secondsFromNow / 60).toFixed(1),
        hoursFromNow: (secondsFromNow / 3600).toFixed(1)
      },
      explanation: 'Task will run at this local time in user\'s timezone'
    });
  } catch (error) {
    logger.error('Error in /api/schedule-task', { error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/health
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Module 23.1 - Dates, UTC, Timezone Handling',
    timestamp: Math.floor(Date.now() / 1000)
  });
});

// Start server
app.listen(HTTP_PORT, () => {
  console.log(`✅ Module 23.1 server running on port ${HTTP_PORT}`);
  console.log(`📚 Test endpoints:`);
  console.log(`   GET  /api/now`);
  console.log(`   GET  /api/convert?iso=2026-03-29T12:00:00Z`);
  console.log(`   GET  /api/timezone/America/New_York?timestamp=1711756800`);
  console.log(`   GET  /api/dst-info?year=2026&tz=America/New_York`);
  console.log(`   POST /api/schedule-task (body: {hour, minute, timezone})`);
  console.log(`   GET  /api/health`);
});

module.exports = app;
