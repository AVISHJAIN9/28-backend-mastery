/**
 * SOLID Principles - Single Responsibility
 * 
 * Each class should have one reason to change.
 */

// BAD: Multiple responsibilities
class UserHandlerBad {
  createUser(userData) {
    // Validation
    if (!userData.email) throw new Error('Email required');
    
    // Database
    const user = { id: Math.random(), ...userData };
    
    // Email sending
    console.log(`Sending welcome email to ${user.email}`);
    
    // Logging
    console.log(`User created: ${user.id}`);
    
    return user;
  }
}

// GOOD: Separated responsibilities
class UserValidator {
  validate(userData) {
    if (!userData.email) throw new Error('Email required');
    if (!userData.name) throw new Error('Name required');
    return true;
  }
}

class UserRepository {
  create(userData) {
    return { id: Math.random(), ...userData };
  }
}

class EmailService {
  sendWelcomeEmail(user) {
    console.log(`Sending welcome email to ${user.email}`);
  }
}

class UserLogger {
  logUserCreation(user) {
    console.log(`User created: ${user.id}`);
  }
}

class UserService {
  constructor(validator, repo, emailService, logger) {
    this.validator = validator;
    this.repo = repo;
    this.emailService = emailService;
    this.logger = logger;
  }

  createUser(userData) {
    this.validator.validate(userData);
    const user = this.repo.create(userData);
    this.emailService.sendWelcomeEmail(user);
    this.logger.logUserCreation(user);
    return user;
  }
}

// Usage
const service = new UserService(
  new UserValidator(),
  new UserRepository(),
  new EmailService(),
  new UserLogger()
);

const user = service.createUser({ name: 'Alice', email: 'alice@test.com' });

module.exports = { UserService, UserValidator, UserRepository, EmailService, UserLogger };
