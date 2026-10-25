/**
 * Strategy Pattern - Payment Processing
 * 
 * Different algorithms for the same task.
 * Client code is independent of the specific strategy implementation.
 */

// Strategy interfaces
class PaymentStrategy {
  pay(amount) { throw new Error('Not implemented'); }
  validate() { throw new Error('Not implemented'); }
}

class CreditCardStrategy extends PaymentStrategy {
  constructor(cardNumber, cvv, expiryDate) {
    super();
    this.cardNumber = cardNumber;
    this.cvv = cvv;
    this.expiryDate = expiryDate;
  }

  validate() {
    return this.cardNumber && this.cvv && this.expiryDate;
  }

  pay(amount) {
    if (!this.validate()) throw new Error('Invalid card details');
    return {
      method: 'Credit Card',
      amount,
      status: 'paid',
      transactionId: 'CC' + Math.random().toString(36).substr(2, 9)
    };
  }
}

class PayPalStrategy extends PaymentStrategy {
  constructor(email, password) {
    super();
    this.email = email;
    this.password = password;
  }

  validate() {
    return this.email && this.password;
  }

  pay(amount) {
    if (!this.validate()) throw new Error('Invalid PayPal credentials');
    return {
      method: 'PayPal',
      amount,
      status: 'paid',
      transactionId: 'PP' + Math.random().toString(36).substr(2, 9)
    };
  }
}

class CryptoCurrencyStrategy extends PaymentStrategy {
  constructor(walletAddress) {
    super();
    this.walletAddress = walletAddress;
  }

  validate() {
    return this.walletAddress;
  }

  pay(amount) {
    if (!this.validate()) throw new Error('Invalid wallet');
    return {
      method: 'Cryptocurrency',
      amount,
      status: 'pending',
      transactionId: 'CRYPTO' + Math.random().toString(36).substr(2, 9)
    };
  }
}

// Context
class PaymentProcessor {
  constructor(strategy) {
    this.strategy = strategy;
  }

  setStrategy(strategy) {
    this.strategy = strategy;
  }

  processPayment(amount) {
    return this.strategy.pay(amount);
  }
}

// Usage
const processor = new PaymentProcessor(
  new CreditCardStrategy('4111-1111-1111-1111', '123', '12/25')
);

console.log(processor.processPayment(100));

// Switch strategies
processor.setStrategy(new PayPalStrategy('user@example.com', 'password'));
console.log(processor.processPayment(50));

module.exports = { PaymentProcessor, CreditCardStrategy, PayPalStrategy, CryptoCurrencyStrategy };
