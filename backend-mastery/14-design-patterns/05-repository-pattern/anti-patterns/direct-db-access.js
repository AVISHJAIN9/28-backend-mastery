/**
 * ANTI-PATTERN: No Repository - Direct Database Access
 * 
 * Business logic directly queries database.
 * Hard to test, change databases, or optimize queries.
 */

class UserServiceBad {
  async getUser(id) {
    // Direct database call - tight coupling!
    const result = await globalDatabase.query(
      `SELECT * FROM users WHERE id = ${id}`
    );
    return result;
  }

  async updateUser(id, data) {
    await globalDatabase.execute(
      `UPDATE users SET name = '${data.name}' WHERE id = ${id}`
    );
  }

  async getAllUsers() {
    return await globalDatabase.query('SELECT * FROM users');
  }
}

console.log('=== ANTI-PATTERN: No Repository ===\n');
console.log('✗ Business logic mixed with data access');
console.log('✗ Switching databases = major refactoring');
console.log('✗ Impossible to test without real database');
console.log('✗ SQL scattered throughout code');
console.log('✗ Hard to add caching or optimization');

module.exports = UserServiceBad;
