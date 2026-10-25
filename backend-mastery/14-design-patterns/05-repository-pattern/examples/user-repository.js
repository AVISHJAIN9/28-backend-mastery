/**
 * Repository Pattern - Data Access Abstraction
 * 
 * Abstracts data source details from business logic.
 * Enables easy switching between different data stores.
 */

class UserRepository {
  async findById(id) { throw new Error('Not implemented'); }
  async findAll() { throw new Error('Not implemented'); }
  async save(user) { throw new Error('Not implemented'); }
  async delete(id) { throw new Error('Not implemented'); }
}

class InMemoryUserRepository extends UserRepository {
  constructor() {
    super();
    this.users = new Map();
    this.nextId = 1;
  }

  async findById(id) {
    return this.users.get(id) || null;
  }

  async findAll() {
    return Array.from(this.users.values());
  }

  async save(user) {
    user.id = user.id || this.nextId++;
    this.users.set(user.id, user);
    return user;
  }

  async delete(id) {
    this.users.delete(id);
  }
}

class DatabaseUserRepository extends UserRepository {
  constructor(db) {
    super();
    this.db = db;
  }

  async findById(id) {
    // Query actual database
    return this.db.query(`SELECT * FROM users WHERE id = ${id}`);
  }

  async findAll() {
    return this.db.query('SELECT * FROM users');
  }

  async save(user) {
    return this.db.execute(`INSERT INTO users VALUES (...)`, user);
  }

  async delete(id) {
    return this.db.execute(`DELETE FROM users WHERE id = ${id}`);
  }
}

// Usage
async function example() {
  const repo = new InMemoryUserRepository();
  
  await repo.save({ name: 'Alice', email: 'alice@test.com' });
  await repo.save({ name: 'Bob', email: 'bob@test.com' });
  
  const user = await repo.findById(1);
  console.log('Found user:', user);
  
  const all = await repo.findAll();
  console.log('All users:', all);
}

module.exports = { UserRepository, InMemoryUserRepository, DatabaseUserRepository };
