# EventEmitter: Deep Dive Theory

## What is EventEmitter?

EventEmitter is Node.js's core pattern for event-driven programming. It allows objects to emit and listen to events, enabling a pub-sub (publish-subscribe) architecture.

### Real-World Use Cases

```
    Streams
    File watchers  
    HTTP requests
    Child processes
    Database clients
    Custom applications
```

## Core EventEmitter Concepts

### 1. Basic Event Emission

```javascript
const { EventEmitter } = require('events');

const emitter = new EventEmitter();

// Add listener
emitter.on('greet', (name) => {
  console.log(`Hello, ${name}!`);
});

// Emit event
emitter.emit('greet', 'Alice'); // Output: Hello, Alice!
emitter.emit('greet', 'Bob');   // Output: Hello, Bob!
```

### 2. Once Listener

```javascript
const emitter = new EventEmitter();

// Listener fires only once
emitter.once('hello', (name) => {
  console.log(`Hi ${name}`);
});

emitter.emit('hello', 'First');  // Fires: "Hi First"
emitter.emit('hello', 'Second'); // DOESN'T fire
```

### 3. Multiple Listeners

```javascript
const emitter = new EventEmitter();

// Multiple listeners for same event
emitter.on('message', () => console.log('Listener 1'));
emitter.on('message', () => console.log('Listener 2'));
emitter.on('message', () => console.log('Listener 3'));

emitter.emit('message');
// Output:
// Listener 1
// Listener 2
// Listener 3
```

### 4. Listener Count

```javascript
const emitter = new EventEmitter();

emitter.on('test', () => {});
emitter.on('test', () => {});
emitter.once('test', () => {});

console.log(emitter.listenerCount('test')); // 3
console.log(emitter.eventNames());          // ['test']
```

## Advanced EventEmitter Patterns

### 1. Removing Listeners

```javascript
const emitter = new EventEmitter();

const handler = (msg) => console.log(msg);

emitter.on('msg', handler);
emitter.emit('msg', 'Hello'); // Fires

// Remove specific handler
emitter.removeListener('msg', handler);
emitter.emit('msg', 'World'); // Doesn't fire

// Remove all listeners for event
emitter.removeAllListeners('msg');

// Remove all listeners (all events)
emitter.removeAllListeners();
```

### 2. Listener Limits

```javascript
const emitter = new EventEmitter();

// Default limit: 10 listeners
console.log(emitter.getMaxListeners()); // 10

// Add 11 listeners (triggers warning)
for (let i = 0; i < 11; i++) {
  emitter.on('spam', () => {});
}

// Warning printed to stderr:
// (node:12345) MaxListenersExceededWarning: Possible EventEmitter memory leak detected...

// Change limit
emitter.setMaxListeners(20);

// Or for all EventEmitters
EventEmitter.defaultMaxListeners = 15;
```

### 3. Event Names

```javascript
const emitter = new EventEmitter();

emitter.on('start', () => {});
emitter.on('stop', () => {});
emitter.once('end', () => {});

console.log(emitter.eventNames()); // ['start', 'stop', 'end']
```

### 4. Prepend Listeners

```javascript
const emitter = new EventEmitter();

emitter.on('task', () => console.log('2nd'));
emitter.prependListener('task', () => console.log('1st'));

emitter.emit('task');
// Output:
// 1st
// 2nd
```

## Error Handling

### 1. Error Event

```javascript
const emitter = new EventEmitter();

// Critical: Always listen to 'error' event
emitter.on('error', (err) => {
  console.error('Error detected:', err.message);
});

// If error emitted with no listener, process crashes!
emitter.emit('error', new Error('Something broke'));

// Without error handler:
// throw err; // Unhandled 'error' event
```

### 2. Wrapping with Try-Catch

```javascript
emitter.on('risky', () => {
  try {
    // Some operation that might fail
    riskyOperation();
  } catch (error) {
    emitter.emit('error', error);
  }
});

emitter.on('error', (err) => {
  console.error('Caught:', err.message);
});
```

### 3. Safe Emit

```javascript
// Check if there are error listeners
if (emitter.listeners('error').length === 0) {
  emitter.on('error', (err) => {
    console.error('Default error handler:', err.message);
  });
}

emitter.emit('error', new Error('test'));
```

## EventEmitter Inheritance

### 1. Extending EventEmitter

```javascript
class MyClass extends EventEmitter {
  constructor(name) {
    super();
    this.name = name;
  }
  
  start() {
    this.emit('start', this.name);
  }
  
  stop() {
    this.emit('stop', this.name);
  }
}

const obj = new MyClass('Server');

obj.on('start', (name) => {
  console.log(`${name} started`);
});

obj.start(); // Output: Server started
```

### 2. Mixin Pattern

```javascript
const { EventEmitter } = require('events');

class User {
  constructor(name) {
    this.name = name;
    this.emitter = new EventEmitter();
  }
  
  login() {
    this.emitter.emit('login', { user: this.name, time: new Date() });
  }
  
  logout() {
    this.emitter.emit('logout', { user: this.name, time: new Date() });
  }
}

const user = new User('Alice');

user.emitter.on('login', (data) => {
  console.log(`${data.user} logged in at ${data.time}`);
});

user.login(); // Alice logged in at ...
```

## Advanced Patterns

### 1. Event Names as Constants

```javascript
const EVENTS = {
  START: 'start',
  STOP: 'stop',
  ERROR: 'error',
  DATA: 'data'
};

class Service extends EventEmitter {
  start() {
    this.emit(EVENTS.START);
  }
  
  stop() {
    this.emit(EVENTS.STOP);
  }
  
  error(err) {
    this.emit(EVENTS.ERROR, err);
  }
}

// Usage
const service = new Service();
service.on(EVENTS.START, () => console.log('Started'));
service.start();
```

### 2. Priority Listeners

```javascript
const emitter = new EventEmitter();

// Normal priority
emitter.on('task', () => console.log('Normal'));

// High priority (prepend)
emitter.prependListener('task', () => console.log('High'));

// Highest priority (once, prepend)
emitter.prependOnceListener('task', () => console.log('Highest'));

emitter.emit('task');
// Output:
// Highest
// High
// Normal
```

### 3. Listener Limit Management

```javascript
function createMonitoredEmitter(maxListeners = 10) {
  const emitter = new EventEmitter();
  emitter.setMaxListeners(maxListeners);
  
  // Track listener additions
  const original_on = emitter.on;
  emitter.on = function(event, listener) {
    const count = emitter.listenerCount(event);
    if (count >= maxListeners) {
      console.warn(`Approaching listener limit for '${event}': ${count} listeners`);
    }
    return original_on.call(this, event, listener);
  };
  
  return emitter;
}
```

### 4. Event Batching

```javascript
class BatchedEmitter extends EventEmitter {
  constructor(batchSize = 10) {
    super();
    this.batchSize = batchSize;
    this.batch = [];
  }
  
  addToBatch(item) {
    this.batch.push(item);
    if (this.batch.length >= this.batchSize) {
      this.emit('batch', this.batch);
      this.batch = [];
    }
  }
  
  flush() {
    if (this.batch.length > 0) {
      this.emit('batch', this.batch);
      this.batch = [];
    }
  }
}

// Usage
const batcher = new BatchedEmitter(5);
batcher.on('batch', (items) => {
  console.log(`Processing batch of ${items.length}`);
});

for (let i = 0; i < 12; i++) {
  batcher.addToBatch(i);
}
batcher.flush();
```

## Async Event Handling

### Promise-Based

```javascript
const { EventEmitter } = require('events');

class AsyncEmitter extends EventEmitter {
  emitAsync(eventName, ...args) {
    return new Promise((resolve, reject) => {
      const listeners = this.listeners(eventName);
      
      if (listeners.length === 0) {
        return resolve();
      }
      
      let completed = 0;
      
      for (const listener of listeners) {
        const result = listener(...args);
        
        if (result instanceof Promise) {
          result
            .then(() => {
              completed++;
              if (completed === listeners.length) resolve();
            })
            .catch(reject);
        } else {
          completed++;
          if (completed === listeners.length) resolve();
        }
      }
    });
  }
}

// Usage
const emitter = new AsyncEmitter();

emitter.on('fetch', async (url) => {
  const data = await fetchData(url);
  console.log(data);
});

emitter.emitAsync('fetch', '/api/data');
```

## Debugging EventEmitter

### 1. Log All Events

```javascript
const emitter = new EventEmitter();

// Patch to log all events
const original_emit = emitter.emit;
emitter.emit = function(event, ...args) {
  console.log(`Event emitted: ${event}`, args);
  return original_emit.apply(this, arguments);
};

emitter.on('test', (val) => console.log('Heard:', val));
emitter.emit('test', 'data'); // Event emitted: test [data]
                               // Heard: data
```

### 2. Monitor Listener Count

```javascript
function monitorEmitter(emitter, interval = 1000) {
  setInterval(() => {
    const eventNames = emitter.eventNames();
    if (eventNames.length > 0) {
      console.log('Current listeners:');
      eventNames.forEach(event => {
        console.log(`  ${event}: ${emitter.listenerCount(event)}`);
      });
    }
  }, interval);
}

const emitter = new EventEmitter();
monitorEmitter(emitter);

// Continuously logs listener counts
```

### 3. Memory Usage Tracking

```javascript
const { EventEmitter } = require('events');

class TrackedEmitter extends EventEmitter {
  constructor() {
    super();
    this.stats = {
      listenerCount: 0,
      eventCount: 0,
      memoryUsage: 0
    };
  }
  
  on(event, listener) {
    this.stats.listenerCount++;
    this.stats.eventCount = this.eventNames().length;
    this.stats.memoryUsage = process.memoryUsage().heapUsed;
    return super.on(event, listener);
  }
  
  getStats() {
    return this.stats;
  }
}
```

## Performance Considerations

### 1. Listener Accumulation

```javascript
// BAD: Creates leak
setInterval(() => {
  emitter.on('data', handler); // Listener added every second!
}, 1000);

// GOOD: Add once, manage lifecycle
emitter.on('data', handler);
// Later...
emitter.removeListener('data', handler);
```

### 2. Memory Impact

```javascript
const emitter = new EventEmitter();

// Adding 1000 listeners
for (let i = 0; i < 1000; i++) {
  emitter.on('test', () => {});
}

// This uses memory for each listener
// Default warning at 10 listeners
// Use removeListener or removeAllListeners when done
```

### 3. Efficient Event Names

```javascript
// Use string constants (better for memory)
const EVT_START = 'start';
const EVT_STOP = 'stop';

emitter.on(EVT_START, () => {});
emitter.emit(EVT_START);

// vs dynamic strings (creates new ones each time)
emitter.on('start' + 'handler', () => {});
```

## Common Pitfalls

### 1. Forgetting Error Handler

```javascript
// CRASH!
const emitter = new EventEmitter();
emitter.emit('error', new Error('Oops'));
// Unhandled 'error' event - process crashes

// SAFE
emitter.on('error', (err) => console.error(err));
emitter.emit('error', new Error('Oops'));
```

### 2. This Binding in Listeners

```javascript
class Counter {
  constructor() {
    this.count = 0;
    this.emitter = new EventEmitter();
  }
  
  increment() {
    this.count++;
    // WRONG: this.emitter.on('increment', function() {
    //   this.count++; // this is not Counter!
    // });
    
    // RIGHT: Arrow function
    this.emitter.on('increment', () => {
      this.count++;
    });
    
    // Or bind explicitly
    this.emitter.on('increment', function() {
      this.count++;
    }.bind(this));
  }
}
```

### 3. Listener Limits

```javascript
const emitter = new EventEmitter();

// Adding 11+ listeners triggers warning
for (let i = 0; i < 15; i++) {
  emitter.on('spam', () => {});
}
// stderr: MaxListenersExceededWarning

// Fix: Disable warning or increase limit
emitter.setMaxListeners(0); // Unlimited (careful!)
```

## Summary

EventEmitter is fundamental to Node.js programming:
- **on()**: Add permanent listener
- **once()**: Add one-time listener
- **emit()**: Trigger event
- **removeListener()**: Remove specific listener
- **removeAllListeners()**: Remove all listeners
- **listenerCount()**: Get listener count
- **setMaxListeners()**: Configure limit
- **error event**: Always handle!

Master EventEmitter → Master Node.js event-driven architecture
