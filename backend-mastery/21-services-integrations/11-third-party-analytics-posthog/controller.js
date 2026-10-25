const { v4: uuidv4 } = require('uuid');

const events = new Map();
const users = new Map();
const flags = new Map();
const cohorts = new Map();

exports.captureEvent = (req, res) => {
  const { event, properties, timestamp } = req.validatedBody;
  const eventId = uuidv4();
  
  events.set(eventId, {
    id: eventId,
    event,
    properties: properties || {},
    timestamp: timestamp || new Date(),
  });
  
  res.json({
    success: true,
    eventId,
    event,
    message: 'Event captured',
  });
};

exports.identifyUser = (req, res) => {
  const { userId, properties } = req.validatedBody;
  
  users.set(userId, {
    id: userId,
    properties: properties || {},
    lastSeen: new Date(),
  });
  
  res.json({
    success: true,
    userId,
    message: 'User identified',
  });
};

exports.getFeatureFlag = (req, res) => {
  const { key, userId } = req.validatedBody;
  const flagKey = `${key}-${userId || 'global'}`;
  
  // Mock feature flag logic
  const enabled = Math.random() > 0.5;
  
  res.json({
    success: true,
    key,
    enabled,
    variant: enabled ? 'test' : 'control',
  });
};

exports.createCohort = (req, res) => {
  const { name, filters } = req.validatedBody;
  const cohortId = uuidv4();
  
  cohorts.set(cohortId, {
    id: cohortId,
    name,
    filters,
    createdAt: new Date(),
  });
  
  res.json({
    success: true,
    cohortId,
    name,
    message: 'Cohort created',
  });
};

exports.getAnalytics = (req, res) => {
  const eventArray = Array.from(events.values());
  const userArray = Array.from(users.values());
  
  res.json({
    success: true,
    totalEvents: eventArray.length,
    totalUsers: userArray.length,
    events: eventArray.slice(-10),
    users: userArray.slice(-10),
  });
};

module.exports = {
  captureEvent,
  identifyUser,
  getFeatureFlag,
  createCohort,
  getAnalytics,
};
