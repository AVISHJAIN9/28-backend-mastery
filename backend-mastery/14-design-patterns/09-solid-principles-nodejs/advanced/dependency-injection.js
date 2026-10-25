/**
 * ADVANCED: SOLID - Dependency Injection
 * 
 * Illustrates D in SOLID - Dependency Inversion Principle.
 */

// Abstraction
class Logger {
  log(message) { throw new Error('Not implemented'); }
}

class ConsoleLogger extends Logger {
  log(message) {
    console.log('[CONSOLE]', message);
  }
}

class FileLogger extends Logger {
  log(message) {
    console.log('[FILE]', message);
  }
}

// Domain logic depends on abstraction, not concrete classes
class UserService {
  constructor(logger) {
    this.logger = logger;
  }

  createUser(userData) {
    this.logger.log(`Creating user: ${userData.name}`);
    return { id: 1, ...userData };
  }
}

// Injection
const consoleService = new UserService(new ConsoleLogger());
const fileService = new UserService(new FileLogger());

consoleService.createUser({ name: 'Alice' });
fileService.createUser({ name: 'Bob' });

module.exports = { Logger, ConsoleLogger, FileLogger, UserService };
