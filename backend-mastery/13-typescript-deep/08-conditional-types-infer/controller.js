/**
 * Module 13.8 Controller: Conditional Types & Infer Patterns
 */

class TypeInferencer {
  // Infer return type from function
  static inferReturnType(fn) {
    const result = fn();
    return typeof result;
  }

  // Infer array element type
  static inferArrayElement(arr) {
    if (!Array.isArray(arr) || arr.length === 0) {
      return 'unknown';
    }
    return typeof arr[0];
  }

  // Infer Promise value type
  static async inferPromiseValue(promise) {
    const result = await promise;
    return typeof result;
  }

  // Infer object property type
  static inferPropertyType(obj, key) {
    if (key in obj) {
      return typeof obj[key];
    }
    return 'undefined';
  }
}

class ConditionalResponseHandler {
  // Route different responses based on type
  static handleResponse(result, options = {}) {
    const { compact = false, detailed = false, publicOnly = false } = options;

    // Conditional: If array, apply array transformations
    if (Array.isArray(result)) {
      if (compact) {
        return result.map(item => this.compactView(item));
      }
      if (publicOnly) {
        return result.map(item => this.publicView(item));
      }
      return result;
    }

    // Conditional: If object
    if (typeof result === 'object' && result !== null) {
      if (compact) {
        return this.compactView(result);
      }
      if (publicOnly) {
        return this.publicView(result);
      }
      if (detailed) {
        return this.detailedView(result);
      }
      return result;
    }

    // Conditional: If primitive
    return result;
  }

  static compactView(obj) {
    return { id: obj.id, name: obj.name };
  }

  static publicView(obj) {
    const { password, ...rest } = obj;
    return rest;
  }

  static detailedView(obj) {
    return {
      ...obj,
      metadata: {
        type: obj.constructor.name,
        keys: Object.keys(obj).length
      }
    };
  }
}

class Repository {
  constructor() {
    this.users = [
      { id: 1, name: 'Alice', email: 'alice@test.com' },
      { id: 2, name: 'Bob', email: 'bob@test.com' },
      { id: 3, name: 'Charlie', email: 'charlie@test.com' }
    ];

    this.posts = [
      { id: 1, title: 'TypeScript Tips', content: 'Learn advanced types' },
      { id: 2, title: 'Conditional Types', content: 'Power of inference' }
    ];
  }

  // Conditional: Returns T or T[] based on input
  getEntity(type, id = null) {
    if (type === 'users') {
      return id === null ? this.users : this.users.find(u => u.id === id);
    }
    if (type === 'posts') {
      return id === null ? this.posts : this.posts.find(p => p.id === id);
    }
    return null;
  }

  // Conditional: Extract type from result
  determineResponseType(result) {
    if (result === null || result === undefined) {
      return 'empty';
    }
    if (Array.isArray(result)) {
      return 'array<' + (result.length === 0 ? 'unknown' : typeof result[0]) + '>';
    }
    return typeof result;
  }
}

class UnwrapperService {
  // Unwrap Promise
  static async unwrapPromise(promise) {
    return await promise;
  }

  // Unwrap Array
  static unwrapArray(arr) {
    return arr[0] || null;
  }

  // Unwrap nested generics
  static unwrap(value) {
    // If Promise
    if (value instanceof Promise) {
      return value.then(v => this.unwrap(v));
    }

    // If Array
    if (Array.isArray(value)) {
      return value[0] || null;
    }

    // If object with value property
    if (typeof value === 'object' && value !== null && 'value' in value) {
      return value.value;
    }

    // Return as-is
    return value;
  }
}

class TypeGuardService {
  // Type guard: Check if is user
  static isUser(obj) {
    return (
      obj &&
      typeof obj.id === 'number' &&
      typeof obj.name === 'string' &&
      typeof obj.email === 'string'
    );
  }

  // Type guard: Check if is array of users
  static isUserArray(arr) {
    return Array.isArray(arr) && arr.every(item => this.isUser(item));
  }

  // Conditional type check
  static isArrayType(value) {
    return Array.isArray(value);
  }

  static isPromiseType(value) {
    return value instanceof Promise;
  }

  static isObjectType(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  }
}

class ValidationService {
  // Conditional validation based on type
  static validate(data, schema) {
    const errors = [];

    for (const [key, rule] of Object.entries(schema)) {
      if (!(key in data)) {
        if (rule.required) {
          errors.push(key + ' is required');
        }
        continue;
      }

      const value = data[key];

      // Type check
      if (rule.type && typeof value !== rule.type) {
        errors.push(key + ' must be ' + rule.type + ', got ' + typeof value);
      }

      // Custom validators
      if (rule.validate && !rule.validate(value)) {
        errors.push(key + ' validation failed');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

export {
  TypeInferencer,
  ConditionalResponseHandler,
  Repository,
  UnwrapperService,
  TypeGuardService,
  ValidationService
};
