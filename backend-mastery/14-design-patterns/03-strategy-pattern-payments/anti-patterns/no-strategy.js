/**
 * ANTI-PATTERN: Strategy without pattern - God class
 * 
 * One class with all logic mixed in.
 * Hard to test, maintain, and extend.
 */

class PaymentProcessorBad {
  processPayment(amount, method, details) {
    // All payment logic in one method - WRONG!
    
    if (method === 'credit-card') {
      // Credit card logic
      const { cardNumber, cvv, expiry } = details;
      if (!cardNumber || !cvv || !expiry) {
        throw new Error('Invalid card');
      }
      // Validate card, check funds, process...
      return { success: true, method: 'credit-card' };
    }
    
    if (method === 'paypal') {
      // PayPal logic
      const { email, password } = details;
      if (!email || !password) {
        throw new Error('Invalid PayPal');
      }
      // Authenticate, process...
      return { success: true, method: 'paypal' };
    }
    
    if (method === 'crypto') {
      // Crypto logic
      const { wallet } = details;
      if (!wallet) {
        throw new Error('Invalid wallet');
      }
      // Check balance, broadcast transaction...
      return { success: true, method: 'crypto' };
    }
    
    throw new Error('Unknown method');
  }
}

console.log('=== ANTI-PATTERN: No Strategy ===\n');
const processor = new PaymentProcessorBad();

console.log('✗ Everything in one method');
console.log('✗ Adding new payment method requires modifying existing code');
console.log('✗ Violates Single Responsibility Principle');
console.log('✗ Hard to test each payment method independently');
console.log('✗ Code is inflexible and difficult to maintain');

module.exports = PaymentProcessorBad;
