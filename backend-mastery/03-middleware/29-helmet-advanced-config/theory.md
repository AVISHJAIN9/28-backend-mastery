# Helmet Advanced Configuration Middleware

## Overview
Helmet is an Express.js middleware that secures your app by setting various HTTP headers. Advanced configuration goes beyond basic usage to fine-tune security policies for specific threats and compliance requirements.

## Key HTTP Security Headers

### 1. Content-Security-Policy (CSP)
```javascript
// Prevents XSS by controlling resource loading
helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'", "cdnjs.cloudflare.com"],
    styleSrc: ["'self'", "'unsafe-inline'", "fonts.googleapis.com"],
    imgSrc: ["'self'", "data:", "https:"],
    connectSrc: ["'self'", "api.example.com"],
    fontSrc: ["'self'", "fonts.gstatic.com"],
    mediaSrc: ["'self'"],
    objectSrc: ["'none'"],
    frameSrc: ["'none'"],
    baseUri: ["'self'"],
    formAction: ["'self'"],
    frameAncestors: ["'none'"]
  }
});
```

### 2. Strict-Transport-Security (HSTS)
```javascript
// Force HTTPS on all connections
helmet.hsts({
  maxAge: 31536000,        // 1 year in seconds
  includeSubDomains: true, // Apply to subdomains
  preload: true            // Add to HSTS preload list
});
```

### 3. X-Frame-Options (Clickjacking)
```javascript
// Prevent embedding in iframes
helmet.frameguard({
  action: 'deny' // Options: 'deny', 'sameorigin', 'allow-from'
});
```

### 4. X-Content-Type-Options (MIME Sniffing)
```javascript
// Prevent browser from sniffing file types
helmet.noSniff();
// Sets: X-Content-Type-Options: nosniff
```

### 5. Referrer-Policy
```javascript
helmet.referrerPolicy({
  policy: 'strict-origin-when-cross-origin'
  // Options: 'no-referrer', 'same-origin', 'strict-origin', etc.
});
```

### 6. Permissions-Policy (Feature Policy)
```javascript
helmet.permissionsPolicy({
  features: {
    camera: ["'none'"],
    microphone: ["'none'"],
    geolocation: ["'self'"],
    payment: ["'self'"],
    usb: ["'none'"],
    accelerometer: ["'none'"],
    gyroscope: ["'none'"],
    magnetometer: ["'none'"]
  }
});
```

## Advanced Configuration Examples

### Production Configuration
```javascript
const productionHelmet = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "https:"],
      connectSrc: ["'self'", "https://api.example.com"],
      objectSrc: ["'none'"],
      frameSrc: ["'none'"],
      upgradeInsecureRequests: []
    },
    reportUri: '/security/csp-report'
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  frameguard: { action: 'deny' },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  permissionsPolicy: {
    features: {
      camera: ["'none'"],
      microphone: ["'none'"],
      payment: ["'self'"]
    }
  }
};

app.use(helmet(productionHelmet));
```

### Development Configuration
```javascript
const developmentHelmet = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      connectSrc: ["'self'", "http://localhost:3000", "ws://localhost:*"]
    }
  },
  hsts: false, // Disable HSTS in development
  frameguard: { action: 'sameorigin' }
};

app.use(helmet(developmentHelmet));
```

## CSP Violation Reporting

### CSP Report Endpoint
```javascript
app.post('/security/csp-report', (req, res) => {
  const report = req.body;
  
  logger.warn('CSP Violation', {
    blockedUri: report['blocked-uri'],
    violationType: report['violation-type'],
    documentUri: report['document-uri'],
    originalPolicy: report['original-policy'],
    sourceFile: report['source-file'],
    lineNumber: report['line-number'],
    columnNumber: report['column-number']
  });
  
  // Store reports for analysis
  cspViolations.push({
    ...report,
    timestamp: new Date(),
    userAgent: req.headers['user-agent']
  });
  
  res.status(204).send();
});

// CSP header with report-uri
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    // ... other directives
    reportUri: '/security/csp-report'
  }
}));
```

## Environment-Specific Headers

### Multi-Environment Setup
```javascript
const getHelmetConfig = () => {
  const baseConfig = {
    crossOriginEmbedderPolicy: false,
    noSniff: true,
    xssFilter: true
  };
  
  if (process.env.NODE_ENV === 'production') {
    return {
      ...baseConfig,
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      },
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "cdn.example.com"],
          upgradeInsecureRequests: []
        }
      }
    };
  }
  
  return baseConfig;
};

app.use(helmet(getHelmetConfig()));
```

## Custom Headers

### Additional Security Headers
```javascript
app.use((req, res, next) => {
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Disable page caching for sensitive data
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  
  // Remove server information
  res.removeHeader('Server');
  res.setHeader('Server', 'MyApp/1.0');
  
  // Additional XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  next();
});
```

## Compliance Considerations

### GDPR Compliance
```javascript
// Add privacy header
app.use((req, res, next) => {
  res.setHeader('X-Privacy-Policy', '/privacy');
  next();
});
```

### HIPAA / PCI-DSS
```javascript
const complianceHelmet = {
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'"],
      imgSrc: ["'self'"],
      upgradeInsecureRequests: []
    }
  },
  frameguard: { action: 'deny' },
  noSniff: true,
  referrerPolicy: { policy: 'no-referrer' }
};

app.use(helmet(complianceHelmet));
```

## Testing & Validation

### Check Headers
```bash
# Using curl
curl -I https://example.com

# Verify headers present
curl -I https://example.com | grep "Strict-Transport-Security"
curl -I https://example.com | grep "Content-Security-Policy"
```

### Header Analysis Tools
- [Security Headers](https://securityheaders.com)
- [Mozilla Observatory](https://observatory.mozilla.org)
- [SSL Labs](https://www.ssllabs.com/ssltest/)

## Performance Impact

- **Minimal overhead**: Helmet adds <1ms latency
- **Header processing**: Cached by browsers
- **Development only**: Disable header validation in development if troubleshooting
- **Monitoring**: Track header sizes and response time impact
