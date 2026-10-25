/**
 * ANTI-PATTERN: No DDD - Anemic Domain Model
 * 
 * Business logic scattered outside domain objects.
 */

class UserBad {
  constructor(id, name, email) {
    this.id = id;
    this.name = name;
    this.email = email;
  }
  // No business methods - just data container
}

class UserServiceBad {
  // All logic here - User is just a data bag
  isValidEmail(email) {
    return email.includes('@');
  }

  canCreateUser(user) {
    return user.name && user.email;
  }

  sendWelcomeEmail(user) {
    console.log(`Email to ${user.email}`);
  }
}

console.log('=== ANTI-PATTERN: Anemic Domain ===\n');
console.log('✗ User object has no behavior');
console.log('✗ Business logic scattered in service classes');
console.log('✗ Hard to reason about domain');
console.log('✗ Objects are just data containers');

module.exports = { UserBad, UserServiceBad };
