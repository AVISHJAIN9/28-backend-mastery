/**
 * ADVANCED: Observer with Wildcards and Pattern Matching
 * 
 * Listen to multiple events with patterns or wildcards.
 */

class AdvancedEventEmitter {
  constructor() {
    this.listeners = [];
  }

  on(pattern, callback) {
    this.listeners.push({ pattern, callback });
  }

  emit(eventName, data) {
    this.listeners.forEach(({ pattern, callback }) => {
      // Support wildcards: 'user.*' matches 'user.login' and 'user.logout'
      const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
      if (regex.test(eventName)) {
        callback({ event: eventName, data });
      }
    });
  }

  removeAll() {
    this.listeners = [];
  }
}

// Usage
const emitter = new AdvancedEventEmitter();

emitter.on('user.*', (info) => console.log('User event:', info.event));
emitter.on('order.*', (info) => console.log('Order event:', info.event));
emitter.on('*.error', (info) => console.log('Error:', info.event));

emitter.emit('user.login', { id: 1 });
emitter.emit('user.logout', { id: 1 });
emitter.emit('order.created', { orderId: 123 });
emitter.emit('system.error', { code: 500 });

module.exports = AdvancedEventEmitter;
