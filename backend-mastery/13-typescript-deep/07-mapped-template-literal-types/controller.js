/**
 * Module 13.7 Controller: Mapped & Template Literal Types
 */

class UserRepository {
  constructor() {
    this.users = [
      { id: 1, name: 'Alice', email: 'alice@test.com', isActive: true, createdAt: new Date() },
      { id: 2, name: 'Bob', email: 'bob@test.com', isActive: true, createdAt: new Date() },
      { id: 3, name: 'Charlie', email: 'charlie@test.com', isActive: false, createdAt: new Date() }
    ];
  }

  getAll() {
    return this.users;
  }

  getById(id) {
    return this.users.find(u => u.id === id);
  }

  create(data) {
    const user = {
      id: Math.max(...this.users.map(u => u.id), 0) + 1,
      ...data,
      isActive: true,
      createdAt: new Date()
    };
    this.users.push(user);
    return user;
  }

  update(id, data) {
    const user = this.users.find(u => u.id === id);
    if (!user) return null;
    Object.assign(user, data);
    return user;
  }

  delete(id) {
    const index = this.users.findIndex(u => u.id === id);
    if (index === -1) return null;
    return this.users.splice(index, 1)[0];
  }
}

class MapperService {
  // Generate getters using template literal pattern
  static createGetters(obj) {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      const getterName = 'get' + key.charAt(0).toUpperCase() + key.slice(1);
      result[getterName] = () => value;
    }
    return result;
  }

  // Generate setters using template literal pattern
  static createSetters(obj) {
    const result = {};
    for (const key of Object.keys(obj)) {
      const setterName = 'set' + key.charAt(0).toUpperCase() + key.slice(1);
      result[setterName] = (value) => {
        obj[key] = value;
      };
    }
    return result;
  }

  // Mapped type: Extract subset fields
  static pick(obj, keys) {
    const result = {};
    keys.forEach(key => {
      if (key in obj) result[key] = obj[key];
    });
    return result;
  }

  // Mapped type: Exclude fields
  static omit(obj, keys) {
    const result = { ...obj };
    keys.forEach(key => delete result[key]);
    return result;
  }

  // Mapped type: Convert to readonly
  static makeReadonly(obj) {
    return Object.freeze({ ...obj });
  }

  // Mapped type: Partial (all optional)
  static toPartial(obj) {
    return { ...obj };
  }

  // Mapped type: Required (all required)
  static makeRequired(obj, required) {
    required.forEach(key => {
      if (!(key in obj) || obj[key] === undefined) {
        throw new Error('Required field missing: ' + key);
      }
    });
    return obj;
  }
}

class EventEmitter {
  constructor() {
    this.listeners = {};

    // Event handlers mapped from strings
    this.eventHandlers = {
      'user:created': (user) => console.log('Created: ' + user.name),
      'user:updated': (user) => console.log('Updated: ' + user.name),
      'user:deleted': (id) => console.log('Deleted: ' + id),
      'user:activated': (user) => console.log('Activated: ' + user.name),
      'user:deactivated': (user) => console.log('Deactivated: ' + user.name)
    };
  }

  on(event, handler) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(handler);
  }

  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(handler => handler(data));
    }
    // Call predefined handler if exists
    if (this.eventHandlers[event]) {
      this.eventHandlers[event](data);
    }
  }
}

class ColumnMapper {
  constructor() {
    // Map database columns to API fields
    this.columnMapping = {
      db_id: 'id',
      db_name: 'name',
      db_email: 'email',
      db_active: 'isActive',
      db_created: 'createdAt'
    };
  }

  // Database record to API response (mapped)
  dbToApi(dbRecord) {
    const result = {};
    for (const [dbCol, apiField] of Object.entries(this.columnMapping)) {
      if (dbCol in dbRecord) {
        result[apiField] = dbRecord[dbCol];
      }
    }
    return result;
  }

  // API request to database record (reverse mapped)
  apiToDb(apiRecord) {
    const result = {};
    const reverseMapping = Object.fromEntries(
      Object.entries(this.columnMapping).map(([db, api]) => [api, db])
    );
    for (const [apiField, dbCol] of Object.entries(reverseMapping)) {
      if (apiField in apiRecord) {
        result[dbCol] = apiRecord[apiField];
      }
    }
    return result;
  }
}

class StateManager {
  constructor() {
    // Mapped loading states
    this.loadingStates = {};
    this.errorStates = {};
  }

  setLoading(key, value) {
    this.loadingStates[key + 'Loading'] = value;
  }

  setError(key, value) {
    this.errorStates[key + 'Error'] = value;
  }

  getLoadingStates() {
    return { ...this.loadingStates };
  }

  getErrorStates() {
    return { ...this.errorStates };
  }

  getState() {
    return {
      ...this.loadingStates,
      ...this.errorStates
    };
  }
}

export { UserRepository, MapperService, EventEmitter, ColumnMapper, StateManager };
