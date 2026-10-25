/**
 * Factory Pattern - Payment Gateway Factory
 * 
 * Different payment methods have different implementations.
 * Factory encapsulates the creation logic.
 */

class CreditCardPayment {
  process(amount, cardNumber) {
    return {
      method: 'Credit Card',
      amount,
      cardNumber: '**** **** **** ' + cardNumber.slice(-4),
      status: 'processing',
      fee: amount * 0.029 // 2.9% fee
    };
  }
}

class PayPalPayment {
  process(amount, email) {
    return {
      method: 'PayPal',
      amount,
      email,
      status: 'processing',
      fee: amount * 0.034 // 3.4% fee
    };
  }
}

class StripePayment {
  process(amount, token) {
    return {
      method: 'Stripe',
      amount,
      token: token.substring(0, 10) + '...',
      status: 'processing',
      fee: amount * 0.029
    };
  }
}

class PaymentFactory {
  static createPaymentGateway(type) {
    const gateways = {
      'credit-card': CreditCardPayment,
      'paypal': PayPalPayment,
      'stripe': StripePayment
    };

    const Gateway = gateways[type];
    if (!Gateway) {
      throw new Error(`Unknown payment method: ${type}`);
    }

    return new Gateway();
  }
}

// Usage
const ccPayment = PaymentFactory.createPaymentGateway('credit-card');
const ppPayment = PaymentFactory.createPaymentGateway('paypal');

console.log(ccPayment.process(100, '4111111111111111'));
console.log(ppPayment.process(50, 'buyer@example.com'));

module.exports = PaymentFactory;
