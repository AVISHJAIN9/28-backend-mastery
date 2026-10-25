/**
 * ADVANCED: MVC with Observers
 * 
 * Combine MVC with Observer pattern for reactive updates.
 */

class ReactiveModel {
  constructor() {
    this.observers = [];
    this.data = {};
  }

  subscribe(observer) {
    this.observers.push(observer);
  }

  setState(key, value) {
    this.data[key] = value;
    this.notifyObservers();
  }

  notifyObservers() {
    this.observers.forEach(obs => obs.update(this.data));
  }

  getData() {
    return this.data;
  }
}

class OptimisticView {
  constructor(model) {
    this.model = model;
    this.model.subscribe(this);
  }

  update(data) {
    console.log('View updated:', data);
    this.render(data);
  }

  render(data) {
    console.log(`Rendering:`, JSON.stringify(data, null, 2));
  }
}

// Usage
const model = new ReactiveModel();
const view = new OptimisticView(model);

model.setState('user', { id: 1, name: 'Alice' });
model.setState('loading', false);

module.exports = { ReactiveModel, OptimisticView };
