/**
 * Module 13.5 Controller: Discriminated Union Patterns
 */

// Database
class UserRepository {
  constructor() {
    this.users = [
      { id: 1, name: 'Alice', email: 'alice@test.com', status: 'active' },
      { id: 2, name: 'Bob', email: 'bob@test.com', status: 'active' },
    ];
  }

  // Find user with discriminated result
  findById(id) {
    const user = this.users.find(u => u.id === id);
    if (user) {
      return {
        type: 'success',
        ok: true,
        data: user
      };
    }
    return {
      type: 'error',
      ok: false,
      error: { code: 'NOT_FOUND', message: 'User not found' }
    };
  }

  // Create with validation
  create(data) {
    // Validation
    if (!data.email || !data.name) {
      return {
        type: 'error',
        ok: false,
        error: { code: 'VALIDATION_ERROR', message: 'Email and name required' }
      };
    }

    const newUser = {
      id: Math.max(...this.users.map(u => u.id), 0) + 1,
      ...data,
      status: data.status || 'active'
    };

    this.users.push(newUser);

    return {
      type: 'success',
      ok: true,
      data: newUser,
      message: 'User created'
    };
  }

  // Find all
  findAll() {
    return {
      type: 'success',
      ok: true,
      data: this.users
    };
  }

  // Update with validation
  update(id, updates) {
    const user = this.users.find(u => u.id === id);
    if (!user) {
      return {
        type: 'error',
        ok: false,
        error: { code: 'NOT_FOUND', message: 'User not found' }
      };
    }

    Object.assign(user, updates);
    return {
      type: 'success',
      ok: true,
      data: user,
      message: 'User updated'
    };
  }

  // Delete
  delete(id) {
    const index = this.users.findIndex(u => u.id === id);
    if (index === -1) {
      return {
        type: 'error',
        ok: false,
        error: { code: 'NOT_FOUND', message: 'User not found' }
      };
    }

    const deleted = this.users.splice(index, 1)[0];
    return {
      type: 'success',
      ok: true,
      data: deleted,
      message: 'User deleted'
    };
  }
}

// Service layer with discriminated unions
class UserService {
  constructor() {
    this.repository = new UserRepository();
  }

  // Return discriminated union
  async getUserWithResult(id) {
    return this.repository.findById(id);
  }

  // Chaining discriminated unions
  async createAndFetch(data) {
    const createResult = this.repository.create(data);

    if (createResult.ok) {
      return createResult; // Success case
    }

    return createResult; // Error case
  }

  // Pattern matching on discriminated union
  handleResult(result) {
    if (result.ok) {
      return {
        status: 'success',
        payload: result.data,
        message: result.message
      };
    } else {
      return {
        status: 'error',
        code: result.error.code,
        message: result.error.message
      };
    }
  }
}

// State machine using discriminated unions
class OrderState {
  // Different order states
  static pending = { type: 'pending', status: 'pending' };
  static processing = { type: 'processing', status: 'processing' };
  static shipped = { type: 'shipped', trackingNumber: null };
  static delivered = { type: 'delivered', deliveredAt: null };
  static cancelled = { type: 'cancelled', reason: null };

  // Type guard
  static isShipped(state) {
    return state.type === 'shipped';
  }

  static isDelivered(state) {
    return state.type === 'delivered';
  }
}

class OrderService {
  constructor() {
    this.orders = [];
  }

  createOrder(items) {
    return {
      id: Math.random(),
      items,
      state: OrderState.pending,
      createdAt: new Date()
    };
  }

  processOrder(orderId) {
    const order = this.orders.find(o => o.id === orderId);
    if (order) {
      order.state = OrderState.processing;
    }
    return order;
  }

  shipOrder(orderId, trackingNumber) {
    const order = this.orders.find(o => o.id === orderId);
    if (order) {
      order.state = { type: 'shipped', trackingNumber };
    }
    return order;
  }

  // Handle order based on state (exhaustiveness checking in TS)
  handleOrder(order) {
    switch (order.state.type) {
      case 'pending':
        return 'Waiting to process';
      case 'processing':
        return 'Processing now';
      case 'shipped':
        return 'Shipped with ' + order.state.trackingNumber;
      case 'delivered':
        return 'Delivered at ' + order.state.deliveredAt;
      case 'cancelled':
        return 'Cancelled: ' + order.state.reason;
      default:
        return 'Unknown state';
    }
  }
}

export { UserRepository, UserService, OrderState, OrderService };
