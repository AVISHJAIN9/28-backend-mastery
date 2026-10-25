# Proxy Middleware & Reverse Proxy Setup

## Overview
Proxy middleware enables Express.js to forward requests to other servers/services. Reverse proxies sit in front of applications, routing traffic intelligently. Essential for microservices, API gateways, load balancing, and service integration.

## Key Concepts

### 1. Proxy Types
- **Forward Proxy**: Client → Proxy → Server (acts for client)
- **Reverse Proxy**: Client → Proxy → Backend Servers (gateway)
- **Load Balancer**: Distributes load across multiple backends
- **API Gateway**: Central entry point for microservices

### 2. Reverse Proxy Benefits
- **Load Balancing**: Distribute requests across servers
- **Service Routing**: Route requests to different backends
- **SSL Termination**: Decrypt HTTPS at proxy
- **Caching**: Cache responses for performance
- **Security**: Hide backend server details
- **Service Discovery**: Route to healthy services

### 3. Common Implementations
- **Nginx**: Industry standard reverse proxy
- **Express-http-proxy**: Node.js proxy middleware
- **node-http-proxy**: Low-level proxy library
- **AWS ELB**: Cloud-based load balancer

## Express-http-proxy Implementation

### Basic Proxy Setup
```javascript
const express = require('express');
const proxy = require('express-http-proxy');

const app = express();

// Proxy all requests to backend
app.use(proxy('http://backend-server.local:3000'));
```

### Route-Based Proxying
```javascript
// Route-specific proxies
app.use('/api/users', proxy('http://users-service:3001'));
app.use('/api/orders', proxy('http://orders-service:3002'));
app.use('/api/auth', proxy('http://auth-service:3003'));
```

### With Request/Response Interceptors
```javascript
const proxyWithInterceptor = proxy('http://backend.local:3000', {
  // Intercept and modify requests
  proxyReqPathResolver: (req) => {
    return '/api' + req.path; // Prepend /api to path
  },
  
  // Add custom headers to backend
  proxyReqOptDecorator: (proxyReq, srcReq) => {
    proxyReq.setHeader('X-Forwarded-User', srcReq.user?.id);
    proxyReq.setHeader('X-Request-ID', srcReq.id);
    return proxyReq;
  },
  
  // Process backend response
  userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
    data = JSON.parse(proxyResData.toString('utf8'));
    data.timestamp = new Date().toISOString();
    return JSON.stringify(data);
  }
});

app.use('/api', proxyWithInterceptor);
```

## Reverse Proxy Architecture

### Multi-Service Routing
```javascript
const userServiceProxy = proxy('http://users-service:3001', {
  proxyReqPathResolver: (req) => '/api/v1' + req.path
});

const orderServiceProxy = proxy('http://orders-service:3002', {
  proxyReqPathResolver: (req) => '/api/v1' + req.path
});

const productServiceProxy = proxy('http://products-service:3003', {
  proxyReqPathResolver: (req) => '/api/v1' + req.path
});

// Route to services
app.use('/users', userServiceProxy);
app.use('/orders', orderServiceProxy);
app.use('/products', productServiceProxy);
```

### Health Check & Load Balancing
```javascript
const backends = [
  { url: 'http://backend1:3000', healthy: true },
  { url: 'http://backend2:3000', healthy: true },
  { url: 'http://backend3:3000', healthy: true }
];

// Health check middleware
setInterval(async () => {
  for (const backend of backends) {
    try {
      const res = await fetch(`${backend.url}/health`);
      backend.healthy = res.ok;
    } catch (e) {
      backend.healthy = false;
    }
  }
}, 5000);

// Load balancer
let currentIndex = 0;
app.use('/api', (req, res, next) => {
  const healthyBackends = backends.filter(b => b.healthy);
  if (healthyBackends.length === 0) {
    return res.status(503).json({ error: 'All backends down' });
  }
  
  currentIndex = (currentIndex + 1) % healthyBackends.length;
  const backend = healthyBackends[currentIndex];
  
  proxy(backend.url)(req, res, next);
});
```

## Request & Response Manipulation

### Add Authentication
```javascript
const authenticatedProxy = proxy('http://backend:3000', {
  proxyReqOptDecorator: (proxyReq, srcReq) => {
    // Add JWT token to backend request
    const token = srcReq.headers.authorization;
    proxyReq.setHeader('Authorization', token);
    proxyReq.setHeader('X-User-IP', srcReq.ip);
    return proxyReq;
  }
});

app.use('/api', authenticatedProxy);
```

### Request Timeout & Error Handling
```javascript
const proxyWithTimeout = proxy('http://backend:3000', {
  timeout: 10000, // 10 second timeout
  proxyErrorHandler: (err, res, next) => {
    if (err.code === 'ECONNREFUSED') {
      res.status(503).json({ error: 'Service unavailable' });
    } else if (err.code === 'ETIMEDOUT') {
      res.status(504).json({ error: 'Gateway timeout' });
    } else {
      res.status(502).json({ error: 'Bad gateway' });
    }
  }
});

app.use('/api', proxyWithTimeout);
```

### Response Logging
```javascript
const loggingProxy = proxy('http://backend:3000', {
  userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
    logger.info('Proxy response', {
      statusCode: proxyRes.statusCode,
      path: userReq.path,
      method: userReq.method,
      duration: Date.now() - userReq.startTime,
      contentLength: proxyRes.headers['content-length']
    });
    
    return proxyResData;
  }
});
```

## Real-World Scenarios

### API Gateway Pattern
```javascript
// Central API gateway routing to microservices
app.use(authentication); // Auth at gateway
app.use(rateLimiting);   // Rate limit at gateway

app.use('/api/v1/users', proxy('http://users-service:3001'));
app.use('/api/v1/orders', proxy('http://orders-service:3002'));
app.use('/api/v1/payments', proxy('http://payments-service:3003'));
app.use('/api/v1/inventory', proxy('http://inventory-service:3004'));

// Fallback 404
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});
```

### SSL Termination
```javascript
// Frontend receives HTTPS
// Backend receives HTTP (faster, encrypted tunnel to backend)
const https = require('https');
const fs = require('fs');

const httpsOptions = {
  key: fs.readFileSync('server.key'),
  cert: fs.readFileSync('server.cert')
};

const backendProxy = proxy('http://backend:3000', {
  proxyReqOptDecorator: (proxyReq, srcReq) => {
    // Add header indicating HTTPS was used
    proxyReq.setHeader('X-Forwarded-Proto', 'https');
    proxyReq.setHeader('X-Forwarded-For', srcReq.ip);
    return proxyReq;
  }
});

https.createServer(httpsOptions, app).listen(443);
app.use('/api', backendProxy);
```

### Service Mesh Integration
```javascript
// Routes based on service mesh labels
const getBackendByLabel = (label) => {
  const services = {
    'v1': 'http://service-v1:3000',
    'v2': 'http://service-v2:3000',
    'canary': 'http://service-canary:3000'
  };
  return services[label];
};

app.use('/api', (req, res, next) => {
  const version = req.headers['x-api-version'] || 'v1';
  const backend = getBackendByLabel(version);
  proxy(backend)(req, res, next);
});
```

## Nginx Configuration (Alternative)

### Basic Nginx Reverse Proxy
```nginx
upstream backend {
  server backend1:3000;
  server backend2:3000;
  server backend3:3000;
}

server {
  listen 80;
  server_name api.example.com;

  location / {
    proxy_pass http://backend;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

## Performance & Monitoring

### Metrics to Track
- Request latency (client → proxy → backend)
- Backend response times
- Error rates by service
- Active connections per backend
- Cache hit/miss rates

### Caching Proxy
```javascript
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 60 });

app.use('/api', (req, res, next) => {
  if (req.method === 'GET') {
    const cached = cache.get(req.url);
    if (cached) {
      return res.json(cached);
    }
  }
  next();
}, proxy('http://backend:3000'));
```
