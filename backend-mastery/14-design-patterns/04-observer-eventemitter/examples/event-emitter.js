/**
 * Observer Pattern - Event System
 * 
 * Objects subscribe to events and get notified when they occur.
 */

class EventEmitter {
  constructor() {
    this.events = new Map();
  }

  on(event, listener) {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event).push(listener);
    console.log(`Listener registered for event: ${event}`);
  }

  off(event, listener) {
    if (!this.events.has(event)) return;
    const listeners = this.events.get(event);
    const index = listeners.indexOf(listener);
    if (index > -1) listeners.splice(index, 1);
  }

  emit(event, data) {
    if (!this.events.has(event)) return;
    console.log(`Event emitted: ${event}`);
    this.events.get(event).forEach(listener => listener(data));
  }
}

class User {
  constructor(name) {
    this.name = name;
    this.emitter = new EventEmitter();
  }

  register(event, callback) {
    this.emitter.on(event, callback);
  }

  login() {
    console.log(`${this.name} logged in`);
    this.emitter.emit('login', { user: this.name, time: new Date() });
  }

  logout() {
    console.log(`${this.name} logged out`);
    this.emitter.emit('logout', { user: this.name });
  }
}

// Usage
const user = new User('Alice');
user.register('login', (data) => console.log('  → Email sent to user'));
user.register('login', (data) => console.log('  → Analytics logged'));
user.register('logout', (data) => console.log('  → Session cleared'));

user.login();
user.logout();

module.exports = { EventEmitter, User };
