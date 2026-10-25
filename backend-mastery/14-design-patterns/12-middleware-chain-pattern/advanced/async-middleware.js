/**
 * ADVANCED: Async Middleware Chain
 * 
 * Middleware system supporting async operations.
 */

class AsyncMiddleware {
  constructor(handler) {
    this.handler = handler;
  }

  async execute(context, next) {
    throw new Error('Not implemented');
  }
}

class AuthMiddleware extends AsyncMiddleware {
  async execute(context, next) {
    console.log('[AUTH] Validating token...');
    await new Promise(resolve => setTimeout(resolve, 100));
    
    if (!context.token) {
      throw new Error('No token provided');
    }
    
    context.user = { id: 1, name: 'Alice' };
    console.log('[AUTH] ✓ User authenticated');
    
    return next();
  }
}

class DatabaseMiddleware extends AsyncMiddleware {
  async execute(context, next) {
    console.log('[DB] Opening connection...');
    await new Promise(resolve => setTimeout(resolve, 100));
    
    context.db = { query: () => Promise.resolve([]) };
    console.log('[DB] ✓ Connected');
    
    return next();
  }
}

class responseMiddleware extends AsyncMiddleware {
  async execute(context, next) {
    console.log('[RESPONSE] Preparing response...');
    
    const result = await next();
    
    context.response = {
      status: 200,
      data: result,
      timestamp: new Date()
    };
    
    return context.response;
  }
}

class AsyncChain {
  constructor(middlewares) {
    this.middlewares = middlewares;
  }

  async execute(context) {
    let index = 0;

    const next = async () => {
      if (index >= this.middlewares.length) {
        return { success: true };
      }

      const middleware = this.middlewares[index++];
      return middleware.execute(context, next);
    };

    return next();
  }
}

// Usage
async function example() {
  const chain = new AsyncChain([
    new AuthMiddleware(null),
    new DatabaseMiddleware(null),
    new ResponseMiddleware(null)
  ]);

  const context = {
    token: 'Bearer xyz',
    request: { path: '/api/data' }
  };

  try {
    const response = await chain.execute(context);
    console.log('\nFinal response:', response);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

example();

module.exports = { AsyncChain, AuthMiddleware, DatabaseMiddleware };
