const { EventEmitter } = require('events');

const getEventInfo = () => {
  return {
    description: 'EventEmitter: publish-subscribe pattern',
    methods: ['on', 'once', 'emit', 'removeListener'],
    defaultLimit: 10,
  };
};

const basicEmitter = () => {
  const emitter = new EventEmitter();
  const events = [];

  emitter.on('test', (data) => {
    events.push(data);
  });

  emitter.emit('test', 'hello');
  emitter.emit('test', 'world');

  return {
    eventsEmitted: 2,
    events,
    description: 'Basic emit and listen pattern',
  };
};

const testOnce = () => {
  const emitter = new EventEmitter();
  let callCount = 0;

  emitter.once('event', () => {
    callCount++;
  });

  emitter.emit('event');
  emitter.emit('event');
  emitter.emit('event');

  return {
    emitCount: 3,
    callCount,
    description: 'Once listener fires only on first emit',
  };
};

const multipleListeners = () => {
  const emitter = new EventEmitter();
  const results = [];

  emitter.on('data', () => results.push('listener1'));
  emitter.on('data', () => results.push('listener2'));
  emitter.on('data', () => results.push('listener3'));

  emitter.emit('data');

  return {
    listeners: 3,
    results,
    description: 'Multiple listeners fire in order',
  };
};

const testPriority = () => {
  const emitter = new EventEmitter();
  const order = [];

  emitter.on('event', () => order.push('first'));
  emitter.prependListener('event', () => order.push('prepended'));

  emitter.emit('event');

  return {
    order,
    description: 'prependListener fires before on listeners',
  };
};

const testErrorHandling = () => {
  return {
    errorEvent: 'Special error event',
    maxListeners: 10,
    warningThreshold: 10,
    enableWarnings: true,
    description: 'Emit error event for errors, set maxListeners to prevent warnings',
  };
};

module.exports = {
  getEventInfo,
  basicEmitter,
  testOnce,
  multipleListeners,
  testPriority,
  testErrorHandling,
};
