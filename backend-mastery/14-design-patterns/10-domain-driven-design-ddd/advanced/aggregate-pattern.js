/**
 * ADVANCED: DDD - Aggregate Pattern
 * 
 * Aggregates ensure consistency boundaries in domain.
 */

class Money {
  constructor(amount, currency = 'USD') {
    this.amount = amount;
    this.currency = currency;
  }

  add(other) {
    if (this.currency !== other.currency) {
      throw new Error('Currency mismatch');
    }
    return new Money(this.amount + other.amount, this.currency);
  }

  isPositive() {
    return this.amount > 0;
  }
}

class OrderLine {
  constructor(productId, quantity, price) {
    this.productId = productId;
    this.quantity = quantity;
    this.price = price;
  }

  getTotal() {
    return new Money(this.price.amount * this.quantity, this.price.currency);
  }
}

class Order {
  constructor(id, customerId) {
    this.id = id;
    this.customerId = customerId;
    this.lines = [];
    this.status = 'pending';
  }

  addLine(line) {
    if (this.status !== 'pending') {
      throw new Error('Cannot modify completed order');
    }
    this.lines.push(line);
  }

  getTotal() {
    return this.lines.reduce(
      (sum, line) => sum.add(line.getTotal()),
      new Money(0)
    );
  }

  canBeCompleted() {
    return this.lines.length > 0 && this.getTotal().isPositive();
  }

  complete() {
    if (!this.canBeCompleted()) {
      throw new Error('Order cannot be completed');
    }
    this.status = 'completed';
  }
}

// Usage
const order = new Order(1, 'cust-123');
order.addLine(new OrderLine('prod-1', 2, new Money(29.99)));
order.addLine(new OrderLine('prod-2', 1, new Money(49.99)));

console.log('Total:', order.getTotal());
order.complete();
console.log('Status:', order.status);

module.exports = { Money, OrderLine, Order };
