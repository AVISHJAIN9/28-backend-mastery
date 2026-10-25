/**
 * Generic Repository Pattern
 * Demonstrates generics in service layer
 */

// Generic Result type
// type Result<T, E = { message: string; code: string }> = 
//   | { ok: true; data: T }
//   | { ok: false; error: E };

// Generic Repository Interface
// interface Repository<T> {
//   create(item: T): Promise<Result<T>>;
//   getById(id: number): Promise<Result<T>>;
//   getAll(): Promise<Result<T[]>>;
//   update(id: number, updates: Partial<T>): Promise<Result<T>>;
//   delete(id: number): Promise<Result<boolean>>;
// }

/**
 * Generic Repository Base Class
 * Reusable for any entity type
 */
class Repository {
  constructor(items = []) {
    this.items = new Map();
    items.forEach((item, index) => {
      this.items.set(item.id || index + 1, item);
    });
    this.idCounter = items.length + 1;
  }

  /**
   * Create new item
   */
  async create(item) {
    try {
      if (!item.id) {
        item.id = this.idCounter++;
      }
      this.items.set(item.id, item);
      return { ok: true, data: item };
    } catch (error) {
      return { ok: false, error: { message: error.message, code: 'CREATE_ERROR' } };
    }
  }

  /**
   * Get by ID
   */
  async getById(id) {
    try {
      const item = this.items.get(id);
      if (!item) {
        return { ok: false, error: { message: 'Not found', code: 'NOT_FOUND' } };
      }
      return { ok: true, data: item };
    } catch (error) {
      return { ok: false, error: { message: error.message, code: 'GET_ERROR' } };
    }
  }

  /**
   * Get all items
   */
  async getAll() {
    try {
      const items = Array.from(this.items.values());
      return { ok: true, data: items };
    } catch (error) {
      return { ok: false, error: { message: error.message, code: 'LIST_ERROR' } };
    }
  }

  /**
   * Update item
   */
  async update(id, updates) {
    try {
      const item = this.items.get(id);
      if (!item) {
        return { ok: false, error: { message: 'Not found', code: 'NOT_FOUND' } };
      }

      const updated = { ...item, ...updates };
      this.items.set(id, updated);
      return { ok: true, data: updated };
    } catch (error) {
      return { ok: false, error: { message: error.message, code: 'UPDATE_ERROR' } };
    }
  }

  /**
   * Delete item
   */
  async delete(id) {
    try {
      if (!this.items.has(id)) {
        return { ok: false, error: { message: 'Not found', code: 'NOT_FOUND' } };
      }

      this.items.delete(id);
      return { ok: true, data: true };
    } catch (error) {
      return { ok: false, error: { message: error.message, code: 'DELETE_ERROR' } };
    }
  }

  /**
   * Filter items
   */
  async filter(predicate) {
    try {
      const items = Array.from(this.items.values()).filter(predicate);
      return { ok: true, data: items };
    } catch (error) {
      return { ok: false, error: { message: error.message, code: 'FILTER_ERROR' } };
    }
  }

  /**
   * Count items
   */
  async count() {
    return { ok: true, data: this.items.size };
  }

  /**
   * Paginate items
   */
  async paginate(page = 1, pageSize = 10) {
    try {
      const items = Array.from(this.items.values());
      const total = items.length;
      const start = (page - 1) * pageSize;
      const end = start + pageSize;
      const paginatedItems = items.slice(start, end);

      return {
        ok: true,
        data: {
          items: paginatedItems,
          total,
          page,
          pageSize,
          hasMore: end < total
        }
      };
    } catch (error) {
      return { ok: false, error: { message: error.message, code: 'PAGINATE_ERROR' } };
    }
  }

  /**
   * Search in items
   */
  async search(searchFn) {
    try {
      const items = Array.from(this.items.values());
      const results = items.filter(searchFn);
      return { ok: true, data: results };
    } catch (error) {
      return { ok: false, error: { message: error.message, code: 'SEARCH_ERROR' } };
    }
  }

  /**
   * Bulk create
   */
  async bulkCreate(items) {
    try {
      const results = [];
      for (const item of items) {
        const result = await this.create(item);
        results.push(result);
      }
      const successful = results.filter(r => r.ok).length;
      return { ok: true, data: { total: results.length, successful, results } };
    } catch (error) {
      return { ok: false, error: { message: error.message, code: 'BULK_CREATE_ERROR' } };
    }
  }

  /**
   * Get stats
   */
  async stats() {
    try {
      return {
        ok: true,
        data: {
          total: this.items.size,
          idCounter: this.idCounter
        }
      };
    } catch (error) {
      return { ok: false, error: { message: error.message, code: 'STATS_ERROR' } };
    }
  }
}

/**
 * Specialized User Repository with custom methods
 */
class UserRepository extends Repository {
  async getByEmail(email) {
    return this.search(user => user.email === email);
  }

  async getByRole(role) {
    return this.search(user => user.role === role);
  }

  async searchByName(query) {
    const lowerQuery = query.toLowerCase();
    return this.search(user => user.name.toLowerCase().includes(lowerQuery));
  }

  async deactivate(id) {
    const result = await this.getById(id);
    if (!result.ok) return result;

    return this.update(id, { isActive: false });
  }

  async promoteToAdmin(id) {
    const result = await this.getById(id);
    if (!result.ok) return result;

    return this.update(id, { role: 'admin' });
  }
}

/**
 * Generic Service Layer
 */
class Service {
  constructor(repository) {
    this.repository = repository;
  }

  async execute(operation, ...args) {
    try {
      const result = await this.repository[operation](...args);
      return result;
    } catch (error) {
      return {
        ok: false,
        error: { message: error.message, code: 'SERVICE_ERROR' }
      };
    }
  }

  async withCache(operation, args, cacheFn) {
    // Simulate caching
    const cached = cacheFn.get(operation);
    if (cached) return { ok: true, data: cached, cached: true };

    const result = await this.execute(operation, ...args);
    if (result.ok) {
      cacheFn.set(operation, result.data);
    }
    return result;
  }
}

module.exports = { Repository, UserRepository, Service };

