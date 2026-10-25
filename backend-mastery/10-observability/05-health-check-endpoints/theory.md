# Health Check Endpoints Theory

## What are Health Checks?

Health check endpoints are HTTP endpoints that report the application's operational status. They're used by load balancers, orchestrators, and monitoring systems to determine if an application is ready to serve traffic.

### The Problem Without Health Checks

```
Load Balancer routes traffic to server
↓ Server process running but database disconnected
↓ All requests fail
↓ Load balancer doesn't know, keeps routing traffic
↓ Users see errors
↓ Hours to notice and fix
```

### With Health Checks

```
Load Balancer calls GET /health every 10 seconds
↓ Server responds 503 (database disconnected)
↓ Load balancer immediately removes server from pool
↓ Traffic routes to healthy servers
↓ Error transparent to users
↓ Auto-fixed when database reconnects
```

## Types of Health Checks

### 1. Liveness Check (Is the process running?)

```javascript
app.get('/health/live', (req, res) => {
  // Simple check - just confirm server is running
  res.status(200).json({
    status: 'alive',
    timestamp: new Date(),
    uptime: process.uptime()
  });
});
```

### 2. Readiness Check (Can the process handle traffic?)

```javascript
app.get('/health/ready', (req, res) => {
  const isReady = {
    database: db.isConnected(),
    redis: redis.isConnected(),
    diskSpace: getDiskSpaceAvailable() > 1_000_000_000  // > 1GB
  };
  
  const allReady = Object.values(isReady).every(status => status);
  
  if (allReady) {
    res.status(200).json({
      status: 'ready',
      checks: isReady,
      timestamp: new Date()
    });
  } else {
    res.status(503).json({
      status: 'not_ready',
      checks: isReady,
      reason: Object.entries(isReady)
        .filter(([_, ready]) => !ready)
        .map(([name, _]) => `${name} not ready`)
    });
  }
});
```

### 3. Combined Health Check

```javascript
app.get('/health', (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date(),
    uptime: process.uptime(),
    checks: {
      database: {
        status: 'up',
        responseTime: '15ms'
      },
      redis: {
        status: 'up',
        responseTime: '2ms'
      },
      memory: {
        status: 'up',
        usage: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`
      },
      disk: {
        status: 'up',
        available: '50GB'
      }
    }
  };
  
  res.status(200).json(health);
});
```

## Kubernetes Health Probes

### Liveness Probe

If liveness probe fails, Kubernetes restarts container.

```yaml
# kubernetes/deployment.yaml
containers:
  - name: api-server
    image: api:latest
    livenessProbe:
      httpGet:
        path: /health/live
        port: 8000
      initialDelaySeconds: 10
      periodSeconds: 10
      timeoutSeconds: 5
      failureThreshold: 3
```

### Readiness Probe

If readiness probe fails, Kubernetes removes from load balancer.

```yaml
containers:
  - name: api-server
    image: api:latest
    readinessProbe:
      httpGet:
        path: /health/ready
        port: 8000
      initialDelaySeconds: 5
      periodSeconds: 5
      timeoutSeconds: 3
      failureThreshold: 2
```

## Express Implementation

### Basic Health Check Middleware

```javascript
const createHealthCheck = (checks = {}) => {
  return async (req, res) => {
    const results = {};
    
    for (const [name, checkFn] of Object.entries(checks)) {
      try {
        const startTime = Date.now();
        const result = await Promise.race([
          checkFn(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), 5000)
          )
        ]);
        
        results[name] = {
          status: result ? 'up' : 'down',
          responseTime: `${Date.now() - startTime}ms`
        };
      } catch (error) {
        results[name] = {
          status: 'down',
          error: error.message
        };
      }
    }
    
    const allHealthy = Object.values(results).every(r => r.status === 'up');
    
    res.status(allHealthy ? 200 : 503).json({
      status: allHealthy ? 'healthy' : 'unhealthy',
      checks: results,
      timestamp: new Date()
    });
  };
};

app.get('/health', createHealthCheck({
  database: async () => {
    const result = await db.query('SELECT 1');
    return !!result;
  },
  redis: async () => {
    const pong = await redis.ping();
    return pong === 'PONG';
  },
  memory: async () => {
    const memUsage = process.memoryUsage();
    const heapMax = memUsage.heapTotal;
    const heapUsed = memUsage.heapUsed;
    return (heapUsed / heapMax) < 0.9;  // Fail if > 90% heap used
  }
}));
```

## Real-World Health Checks

### Database Check

```javascript
const checkDatabase = async () => {
  try {
    const conn = await db.getConnection();
    const result = await conn.query('SELECT 1');
    return true;
  } catch (error) {
    logger.error('Database health check failed', error);
    return false;
  }
};
```

### Redis Check

```javascript
const checkRedis = async () => {
  try {
    const pong = await redis.ping();
    return pong === 'PONG';
  } catch (error) {
    logger.warn('Redis health check failed', error);
    return false;
  }
};
```

### External Service Check

```javascript
const checkExternalAPI = async () => {
  try {
    const response = await fetch('https://api.external-service.com/health', {
      timeout: 3000
    });
    return response.status === 200;
  } catch (error) {
    logger.warn('External API unreachable', error);
    return false;  // Non-critical - ok to degrade
  }
};
```

### Disk Space Check

```javascript
const checkDiskSpace = async () => {
  const { diskUsage } = require('os-utils');
  
  return new Promise((resolve) => {
    diskUsage((data) => {
      // data.totalGbytes, data.usedGbytes, data.freeGbytes
      const percentUsed = (data.usedGbytes / data.totalGbytes) * 100;
      resolve(percentUsed < 85);  // Fail if > 85% used
    });
  });
};
```

### Graceful Shutdown Readiness

```javascript
let isShuttingDown = false;

const checkShutdownState = async () => {
  return !isShuttingDown;
};

process.on('SIGTERM', () => {
  logger.info('SIGTERM received, marking as not ready');
  isShuttingDown = true;
  
  // Allow time for connections to drain
  setTimeout(() => process.exit(0), 30000);
});

app.get('/health/ready', createHealthCheck({
  shutdown_state: checkShutdownState,
  database: checkDatabase,
  redis: checkRedis
}));
```

## Start-up Health Checks

### Startup Verification

```javascript
const startupChecks = async () => {
  try {
    // Test database connection
    logger.info('Verifying database connection...');
    await db.query('SELECT 1');
    logger.info('✓ Database connected');
    
    // Test Redis connection
    logger.info('Verifying Redis connection...');
    const pong = await redis.ping();
    if (pong !== 'PONG') throw new Error('Redis ping failed');
    logger.info('✓ Redis connected');
    
    // Run migrations
    logger.info('Running database migrations...');
    await db.migrate();
    logger.info('✓ Migrations complete');
    
    return true;
  } catch (error) {
    logger.error('Startup verification failed', error);
    process.exit(1);
  }
};

app.listen(8000, async () => {
  await startupChecks();
  logger.info('Server ready for traffic');
});
```

## Monitoring Health Check Status

### Prometheus Metrics

```javascript
const prometheus = require('prom-client');

const healthGauge = new prometheus.Gauge({
  name: 'service_health_check',
  help: 'Health check status (1=healthy, 0=unhealthy)',
  labelNames: ['check_name']
});

const updateHealthMetrics = async () => {
  const health = {
    database: await checkDatabase(),
    redis: await checkRedis(),
    disk: await checkDiskSpace()
  };
  
  Object.entries(health).forEach(([name, status]) => {
    healthGauge.set({ check_name: name }, status ? 1 : 0);
  });
};

// Update every 30 seconds
setInterval(updateHealthMetrics, 30000);
```

## Health Check Response Format

### OpenMetrics Format

```javascript
app.get('/metrics', (req, res) => {
  res.set('Content-Type', 'text/plain');
  res.send(`
# HELP service_up Service up status
# TYPE service_up gauge
service_up 1

# HELP service_health_status Detailed health status
# TYPE service_health_status gauge
service_health_status{component="database"} 1
service_health_status{component="redis"} 1
service_health_status{component="disk"} 0
`);
});
```

## Best Practices

1. **Liveness = Process alive** - Minimal check, fast response
2. **Readiness = Can handle traffic** - Comprehensive check
3. **Separate endpoints** - Different probes for different purposes
4. **Set appropriate timeouts** - Don't make checks too slow
5. **Cache results briefly** - Avoid stampede of health checks
6. **Log failures** - Track why server became unhealthy
7. **Test graceful shutdown** - Health checks during SIGTERM
8. **Monitor the monitors** - Alert on health check failures

## Anti-Patterns

### ❌ Health Check Too Slow

```javascript
// BAD - Check queries massive table
app.get('/health', async (req, res) => {
  const count = await db.query('SELECT COUNT(*) FROM huge_table');
  res.json({ status: 'ok' });
});
```

### ❌ Liveness Check Too Complex

```javascript
// BAD - Liveness should be simple
app.get('/health/live', async (req, res) => {
  // Checking database, redis, disk, memory, network...
  // This should be readiness!
  res.json({ status: 'ok' });
});
```

### ❌ Leaking Sensitive Info

```javascript
// BAD - Leaking internal state
app.get('/health', (req, res) => {
  res.json({
    database: db.connectionString,  // Exposes host/port!
    redis: redis.config,             // Exposes auth!
    users: userCount                 // Business logic in health check
  });
});
```

