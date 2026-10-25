/**
 * ADVANCED: Decorator with Middleware Chain
 * 
 * Chain multiple decorators for HTTP request processing.
 */

class Request {
  constructor(path) {
    this.path = path;
    this.headers = {};
    this.body = null;
  }
}

class RequestDecorator {
  constructor(request) {
    this.request = request;
  }

  process() {
    return this.request;
  }
}

class AuthenticationDecorator extends RequestDecorator {
  process() {
    const req = this.request;
    console.log('→ Checking authorization...');
    req.headers.authenticated = true;
    return req;
  }
}

class ValidationDecorator extends RequestDecorator {
  process() {
    const req = this.request;
    console.log('→ Validating request...');
    if (!req.body) throw new Error('Missing body');
    return req;
  }
}

class LoggingDecorator extends RequestDecorator {
  process() {
    const req = this.request;
    console.log('→ Logging request...');
    console.log(`  Path: ${req.path}`);
    console.log(`  Headers:`, req.headers);
    return req;
  }
}

class CompressionDecorator extends RequestDecorator {
  process() {
    const req = this.request;
    console.log('→ Compressing response...');
    return req;
  }
}

// Usage - Chain decorators
class RequestProcessor {
  static process(path, config = {}) {
    let request = new Request(path);
    request.body = config.body || {};

    if (config.authenticate) {
      request = new AuthenticationDecorator(request).process();
    }
    if (config.validate) {
      request = new ValidationDecorator(request).process();
    }
    if (config.log) {
      request = new LoggingDecorator(request).process();
    }
    if (config.compress) {
      request = new CompressionDecorator(request).process();
    }

    return request;
  }
}

const req = RequestProcessor.process('/api/users', {
  authenticate: true,
  validate: true,
  log: true,
  compress: true
});

console.log('\nRequest ready:', req.path);

module.exports = RequestProcessor;
