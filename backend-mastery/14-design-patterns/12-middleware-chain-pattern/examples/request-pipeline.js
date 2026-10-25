/**
 * Middleware Chain Pattern - Request Pipeline
 * 
 * Chain of responsibility for request processing.
 */

class Middleware {
  constructor(next = null) {
    this.next = next;
  }

  handle(request, response) {
    throw new Error('Not implemented');
  }
}

class LoggingMiddleware extends Middleware {
  handle(request, response) {
    console.log(`[LOG] ${request.method} ${request.path}`);
    return this.next ? this.next.handle(request, response) : response;
  }
}

class AuthenticationMiddleware extends Middleware {
  handle(request, response) {
    console.log('[AUTH] Checking credentials...');
    if (!request.headers.authorization) {
      response.status = 401;
      response.body = 'Unauthorized';
      return response;
    }
    if (this.next) return this.next.handle(request, response);
    return response;
  }
}

class ValidationMiddleware extends Middleware {
  handle(request, response) {
    console.log('[VALIDATE] Validating request...');
    if (!request.body) {
      response.status = 400;
      response.body = 'Bad request';
      return response;
    }
    if (this.next) return this.next.handle(request, response);
    return response;
  }
}

class CompressionMiddleware extends Middleware {
  handle(request, response) {
    console.log('[COMPRESS] Compressing response...');
    response.compressed = true;
    if (this.next) return this.next.handle(request, response);
    return response;
  }
}

// Chain builder
class MiddlewareChain {
  static create() {
    const compression = new CompressionMiddleware(null);
    const validation = new ValidationMiddleware(compression);
    const auth = new AuthenticationMiddleware(validation);
    const logging = new LoggingMiddleware(auth);
    return logging;
  }
}

// Usage
const request = {
  method: 'POST',
  path: '/api/users',
  headers: { authorization: 'Bearer token' },
  body: { name: 'Alice' }
};

const response = { status: 200, body: null, compressed: false };

const chain = MiddlewareChain.create();
const result = chain.handle(request, response);

console.log('\nResult:', result);

module.exports = { MiddlewareChain, LoggingMiddleware, AuthenticationMiddleware };
