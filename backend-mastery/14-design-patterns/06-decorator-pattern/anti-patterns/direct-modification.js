/**
 * ANTI-PATTERN: Modification Instead of Decoration
 * 
 * Modifying original objects instead of decorating them.
 * Leads to fragile base classes and unexpected side effects.
 */

class BadCoffee {
  constructor() {
    this.price = 2;
    this.description = 'Coffee';
  }

  addMilk() {
    this.price += 0.5;
    this.description += ', Milk';
    return this;
  }

  addSugar() {
    this.price += 0.25;
    this.description += ', Sugar';
    return this;
  }
}

console.log('=== ANTI-PATTERN: Modification ===\n');

const coffee1 = new BadCoffee();
coffee1.addMilk().addSugar();
console.log(`Coffee 1: ${coffee1.description} = $${coffee1.price}`);

const coffee2 = new BadCoffee();
// Oops! coffee2 is affected because it shares state
coffee2.addMilk();
console.log(`Coffee 2: ${coffee2.description} = $${coffee2.price}`);

console.log('\nPROBLEMS:');
console.log('✗ Original object is modified');
console.log('✗ Can\'t have different variations of same object');
console.log('✗ Order of operations matters and can cause bugs');

module.exports = BadCoffee;
