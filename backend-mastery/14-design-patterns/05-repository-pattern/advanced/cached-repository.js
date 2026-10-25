/**
 * ADVANCED: Repository with Query Optimization
 * 
 * Repository with built-in caching, pagination, and filtering.
 */

class AdvancedRepository {
  constructor() {
    this.data = [];
    this.cache = new Map();
    this.cacheExpiry = 5000;
  }

  async findById(id) {
    const cacheKey = `id:${id}`;
    
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheExpiry) {
        console.log('From cache:', cacheKey);
        return cached.value;
      }
    }

    const result = this.data.find(item => item.id === id);
    if (result) {
      this.cache.set(cacheKey, { value: result, timestamp: Date.now() });
    }
    return result;
  }

  async findByQuery(filters, pagination = {}) {
    const { skip = 0, limit = 10 } = pagination;
    
    let results = this.data;
    
    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      results = results.filter(item => item[key] === value);
    });

    // Apply pagination
    return results.slice(skip, skip + limit);
  }

  async save(item) {
    item.id = item.id || Math.random();
    this.data.push(item);
    this.cache.clear(); // Invalidate cache
    return item;
  }

  clearCache() {
    this.cache.clear();
  }
}

module.exports = AdvancedRepository;
