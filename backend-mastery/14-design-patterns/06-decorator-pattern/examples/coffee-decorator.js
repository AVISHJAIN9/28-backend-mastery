/**
 * Decorator Pattern - Dynamic Behavior Addition
 * 
 * Adds functionality to objects without modifying their structure.
 */

class Coffee {
  getPrice() { return 2; }
  getDescription() { return 'Coffee'; }
}

class CoffeeDecorator {
  constructor(coffee) {
    this.coffee = coffee;
  }

  getPrice() {
    return this.coffee.getPrice();
  }

  getDescription() {
    return this.coffee.getDescription();
  }
}

class MilkDecorator extends CoffeeDecorator {
  getPrice() {
    return this.coffee.getPrice() + 0.5;
  }

  getDescription() {
    return this.coffee.getDescription() + ', Milk';
  }
}

class SugarDecorator extends CoffeeDecorator {
  getPrice() {
    return this.coffee.getPrice() + 0.25;
  }

  getDescription() {
    return this.coffee.getDescription() + ', Sugar';
  }
}

class WhippedCreamDecorator extends CoffeeDecorator {
  getPrice() {
    return this.coffee.getPrice() + 0.75;
  }

  getDescription() {
    return this.coffee.getDescription() + ', Whipped Cream';
  }
}

// Usage
let coffee = new Coffee();
console.log(`${coffee.getDescription()}: $${coffee.getPrice()}`);

coffee = new MilkDecorator(coffee);
console.log(`${coffee.getDescription()}: $${coffee.getPrice()}`);

coffee = new SugarDecorator(coffee);
console.log(`${coffee.getDescription()}: $${coffee.getPrice()}`);

coffee = new WhippedCreamDecorator(coffee);
console.log(`${coffee.getDescription()}: $${coffee.getPrice()}`);

module.exports = { Coffee, MilkDecorator, SugarDecorator, WhippedCreamDecorator };
