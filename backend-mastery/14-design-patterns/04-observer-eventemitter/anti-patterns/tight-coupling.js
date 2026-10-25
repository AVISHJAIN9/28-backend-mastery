/**
 * ANTI-PATTERN: Tight Coupling (No Observer)
 * 
 * Objects directly call methods on each other.
 * Changes require modifying all connected objects.
 */

class UserBad {
  login() {
    console.log('User logged in');
    // Direct calls - tight coupling!
    this.sendLoginEmail();
    this.logAnalytics();
    this.updateLastLogin();
  }

  sendLoginEmail() {
    console.log('Sending email...');
  }

  logAnalytics() {
    console.log('Logging analytics...');
  }

  updateLastLogin() {
    console.log('Updating login time...');
  }
}

console.log('=== ANTI-PATTERN: Tight Coupling ===\n');
const user = new UserBad();
user.login();

console.log('\nPROBLEMS:');
console.log('✗ User class knows about email, analytics, login tracking');
console.log('✗ Adding new observer requires modifying User class');
console.log('✗ Hard to test individual components');
console.log('✗ Violates Single Responsibility Principle');

module.exports = UserBad;
