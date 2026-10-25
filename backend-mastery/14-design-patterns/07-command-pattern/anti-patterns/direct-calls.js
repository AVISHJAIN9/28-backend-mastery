/**
 * ANTI-PATTERN: Direct Method Calls (No Command)
 * 
 * Tightly coupling caller to receiver.
 * No undo, no queuing, no flexibility.
 */

class ControllerBad {
  constructor(light) {
    this.light = light;
  }

  turnOn() {
    this.light.turnOn();
  }

  turnOff() {
    this.light.turnOff();
  }
}

console.log('=== ANTI-PATTERN: Direct Calls ===\n');
console.log('✗ No undo/redo capability');
console.log('✗ Can\'t queue commands');
console.log('✗ Can\'t schedule delayed execution');
console.log('✗ Tightly coupled to Light class');
console.log('✗ Can\'t serialize or persist commands');

module.exports = ControllerBad;
