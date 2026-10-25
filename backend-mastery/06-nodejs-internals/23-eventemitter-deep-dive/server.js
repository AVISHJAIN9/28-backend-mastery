require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { EventEmitter } = require('events');

const app = express();
const HTTP_PORT = process.env.HTTP_PORT || 3023;

// ==================== Middleware ====================

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==================== EventEmitter Examples ====================

// Global event emitters for demos
const globalEmitter = new EventEmitter();
const eventLogs = [];

// ==================== Routes ====================

// Basic event emission
app.get('/api/events/basic-emit', (req, res) => {
  const emitter = new EventEmitter();
  const events = [];
  
  emitter.on('greet', (name) => {
    events.push(`Hello, ${name}!`);
  });
  
  emitter.emit('greet', 'Alice');
  emitter.emit('greet', 'Bob');
  
  res.json({ success: true, events });
});

// Once listener
app.get('/api/events/once-listener', (req, res) => {
  const emitter = new EventEmitter();
  const events = [];
  
  // Listener only fires once
  emitter.once('alert', (msg) => {
    events.push(`Alert: ${msg}`);
  });
  
  emitter.emit('alert', 'First time');
  emitter.emit('alert', 'Second time - wont fire');
  
  res.json({ success: true, events, totalEmits: 2, listenersTriggered: events.length });
});

// Multiple listeners
app.get('/api/events/multiple-listeners', (req, res) => {
  const emitter = new EventEmitter();
  const logs = [];
  
  // Add multiple listeners
  emitter.on('message', (msg) => {
    logs.push(`Listener 1: ${msg}`);
  });
  
  emitter.on('message', (msg) => {
    logs.push(`Listener 2: ${msg}`);
  });
  
  emitter.on('message', (msg) => {
    logs.push(`Listener 3: ${msg}`);
  });
  
  emitter.emit('message', 'Hello all');
  
  res.json({ success: true, logs, listenerCount: emitter.listenerCount('message') });
});

// Remove listeners
app.get('/api/events/remove-listeners', (req, res) => {
  const emitter = new EventEmitter();
  const logs = [];
  
  const handler1 = (msg) => logs.push(`Handler 1: ${msg}`);
  const handler2 = (msg) => logs.push(`Handler 2: ${msg}`);
  
  emitter.on('test', handler1);
  emitter.on('test', handler2);
  
  emitter.emit('test', 'First'); // Both fire
  
  emitter.removeListener('test', handler1);
  emitter.emit('test', 'Second'); // Only handler2 fires
  
  res.json({ success: true, logs, remainingListeners: emitter.listenerCount('test') });
});

// Event listener warnings
app.post('/api/events/listener-limit', (req, res) => {
  const { listenerCount } = req.body;
  const emitter = new EventEmitter();
  
  // Default limit is 10
  const defaultLimit = emitter.getMaxListeners();
  
  // Add many listeners
  for (let i = 0; i < listenerCount; i++) {
    emitter.on('spam', () => {});
  }
  
  const currentCount = emitter.listenerCount('spam');
  const warning = currentCount > defaultLimit;
  
  res.json({
    success: true,
    defaultLimit,
    currentListenerCount: currentCount,
    warningThreshold: warning,
    message: warning ? 'Warning: excessive listeners detected' : 'OK'
  });
});

// Custom event names
app.post('/api/events/custom-events', (req, res) => {
  const { eventName, data } = req.body;
  const emitter = new EventEmitter();
  const results = [];
  
  emitter.on(eventName, (payload) => {
    results.push({ event: eventName, received: payload });
  });
  
  emitter.emit(eventName, data);
  
  res.json({ success: true, results, eventNames: emitter.eventNames() });
});

// Event inheritance
app.get('/api/events/inheritance', (req, res) => {
  class MyEmitter extends EventEmitter {
    greet(name) {
      this.emit('greeting', name);
    }
  }
  
  const emitter = new MyEmitter();
  const greetings = [];
  
  emitter.on('greeting', (name) => {
    greetings.push(`Hello, ${name}!`);
  });
  
  emitter.greet('Alice');
  emitter.greet('Bob');
  
  res.json({ success: true, greetings });
});

// Error handling with error event
app.get('/api/events/error-handling', (req, res) => {
  const emitter = new EventEmitter();
  const logs = [];
  
  emitter.on('error', (err) => {
    logs.push(`Error caught: ${err.message}`);
  });
  
  // Without error listener, this would crash
  emitter.emit('error', new Error('Something went wrong'));
  
  res.json({ success: true, logs, hasCrashed: false });
});

// Async event handling
app.post('/api/events/async-events', (req, res) => {
  const emitter = new EventEmitter();
  const logs = [];
  
  emitter.on('async-task', async (id) => {
    const delay = Math.random() * 100;
    await new Promise(r => setTimeout(r, delay));
    logs.push(`Task ${id} completed`);
  });
  
  emitter.emit('async-task', 1);
  emitter.emit('async-task', 2);
  emitter.emit('async-task', 3);
  
  // Simulate async wait
  setTimeout(() => {
    res.json({ success: true, logs: logs.sort() });
  }, 200);
});

// Get emitter stats
app.get('/api/events/stats', (req, res) => {
  const emitter = new EventEmitter();
  
  // Add various listeners
  emitter.on('event1', () => {});
  emitter.on('event1', () => {});
  emitter.on('event2', () => {});
  emitter.once('event3', () => {});
  
  res.json({
    success: true,
    eventNames: emitter.eventNames(),
    listenerCounts: {
      event1: emitter.listenerCount('event1'),
      event2: emitter.listenerCount('event2'),
      event3: emitter.listenerCount('event3')
    },
    totalListeners: emitter.listenerCount('event1') + 
                   emitter.listenerCount('event2') + 
                   emitter.listenerCount('event3'),
    maxListeners: emitter.getMaxListeners()
  });
});

// ==================== Health Check ====================

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    module: '23 EventEmitter Deep Dive',
    category: '06 Nodejs Internals',
    port: HTTP_PORT,
    timestamp: new Date().toISOString()
  });
});

// ==================== Root Endpoint ====================

app.get('/', (req, res) => {
  res.json({
    name: '23 EventEmitter Deep Dive',
    module: '06-nodejs-internals - 23',
    description: 'EventEmitter internals, once, listener limits',
    version: '1.0.0',
    category: '06 Nodejs Internals',
    endpoints: {
      health: '/health',
      basicEmit: 'GET /api/events/basic-emit',
      onceListener: 'GET /api/events/once-listener',
      multipleListeners: 'GET /api/events/multiple-listeners',
      removeListeners: 'GET /api/events/remove-listeners',
      listenerLimit: 'POST /api/events/listener-limit',
      customEvents: 'POST /api/events/custom-events',
      inheritance: 'GET /api/events/inheritance',
      errorHandling: 'GET /api/events/error-handling',
      asyncEvents: 'POST /api/events/async-events',
      stats: 'GET /api/events/stats'
    }
  });
});

// ==================== Server Start ====================

app.listen(HTTP_PORT, () => {
  console.log(`[23-eventemitter-deep-dive] listening on http://localhost:${HTTP_PORT}`);
  console.log(`[23-eventemitter-deep-dive] API base: http://localhost:${HTTP_PORT}/api`);
});

module.exports = app;
