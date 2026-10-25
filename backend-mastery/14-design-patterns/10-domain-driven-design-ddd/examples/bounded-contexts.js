/**
 * Domain-Driven Design - Bounded Contexts
 * 
 * Organize code around business domains.
 */

// User Management Domain
class User {
  constructor(id, name, email) {
    this.id = id;
    this.name = name;
    this.email = email;
  }

  isValid() {
    return this.email && this.name;
  }
}

class UserRepository {
  constructor() {
    this.users = new Map();
  }

  save(user) {
    this.users.set(user.id, user);
  }

  getById(id) {
    return this.users.get(id);
  }
}

// Order Management Domain
class Order {
  constructor(id, userId, items) {
    this.id = id;
    this.userId = userId;
    this.items = items;
    this.status = 'pending';
  }

  calculateTotal() {
    return this.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  canBeProcessed() {
    return this.status === 'pending' && this.items.length > 0;
  }
}

class OrderRepository {
  constructor() {
    this.orders = new Map();
  }

  save(order) {
    this.orders.set(order.id, order);
  }

  getById(id) {
    return this.orders.get(id);
  }
}

// Service coordinating both domains
class OrderService {
  constructor(userRepo, orderRepo) {
    this.userRepo = userRepo;
    this.orderRepo = orderRepo;
  }

  processOrder(orderId) {
    const order = this.orderRepo.getById(orderId);
    if (!order.canBeProcessed()) {
      throw new Error('Order cannot be processed');
    }

    const user = this.userRepo.getById(order.userId);
    if (!user) {
      throw new Error('User not found');
    }

    console.log(`Processing order ${order.id} for user ${user.name}`);
    console.log(`Total: $${order.calculateTotal()}`);
    order.status = 'completed';
    this.orderRepo.save(order);
  }
}

// Usage
const userRepo = new UserRepository();
const orderRepo = new OrderRepository();

const user = new User(1, 'Alice', 'alice@test.com');
userRepo.save(user);

const order = new Order(101, 1, [
  { id: 1, price: 29.99, quantity: 2 },
  { id: 2, price: 19.99, quantity: 1 }
]);
orderRepo.save(order);

const service = new OrderService(userRepo, orderRepo);
service.processOrder(101);

module.exports = { User, Order, UserRepository, OrderRepository, OrderService };
