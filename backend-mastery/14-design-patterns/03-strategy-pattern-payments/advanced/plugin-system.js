/**
 * ADVANCED: Strategy with Plugin System
 * 
 * Dynamically load and register strategies at runtime.
 * Maximum flexibility for extensibility.
 */

class StrategyRegistry {
  constructor() {
    this.strategies = new Map();
  }

  register(name, StrategyClass) {
    this.strategies.set(name, StrategyClass);
    console.log(`Registered strategy: ${name}`);
  }

  unregister(name) {
    this.strategies.delete(name);
  }

  get(name) {
    const StrategyClass = this.strategies.get(name);
    if (!StrategyClass) {
      throw new Error(`Strategy not found: ${name}`);
    }
    return new StrategyClass();
  }

  list() {
    return Array.from(this.strategies.keys());
  }
}

class PluginableProcessor {
  constructor(registry) {
    this.registry = registry;
    this.currentStrategy = null;
  }

  useStrategy(name) {
    this.currentStrategy = this.registry.get(name);
    console.log(`Using strategy: ${name}`);
  }

  process(data) {
    if (!this.currentStrategy) {
      throw new Error('No strategy selected');
    }
    return this.currentStrategy.process(data);
  }
}

// Example strategies
class UpperCaseStrategy {
  process(data) {
    return data.toUpperCase();
  }
}

class Reverse Strategy {
  process(data) {
    return data.split('').reverse().join('');
  }
}

// Usage
const registry = new StrategyRegistry();
registry.register('uppercase', UpperCaseStrategy);
registry.register('reverse', ReverseStrategy);

const processor = new PluginableProcessor(registry);

processor.useStrategy('uppercase');
console.log(processor.process('hello')); // HELLO

processor.useStrategy('reverse');
console.log(processor.process('hello')); // olleh

console.log('Available strategies:', registry.list());

module.exports = { StrategyRegistry, PluginableProcessor };
