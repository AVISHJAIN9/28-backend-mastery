# IP Whitelist/Blacklist Middleware

## Overview
IP filtering middleware controls access to applications based on client IP addresses. Whitelist allows only specified IPs; blacklist blocks specific IPs. Critical for API security, admin panels, and protecting against known attackers.

## Key Concepts

### 1. IP Access Control Types
- **Whitelist**: Only allow specific IPs (most secure)
- **Blacklist**: Block specific IPs (less secure, reactive)
- **Combination**: Whitelist trusted IPs, blacklist known attackers
- **Dynamic**: Update lists without restarting

### 2. IP Address Types
- **IPv4**: `192.168.1.1` (32-bit)
- **IPv6**: `2001:0db8:85a3::8a2e:0370:7334` (128-bit)
- **CIDR Notation**: `192.168.1.0/24` (range)
- **Private IPs**: `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`

### 3. Getting Client IP
- **Direct**: `req.connection.remoteAddress` (direct connection)
- **Proxy**: `req.headers['x-forwarded-for']` (behind proxy/CDN)
- **CloudFlare**: `req.headers['cf-connecting-ip']`
- **AWS**: `req.headers['x-real-ip']`

## Implementation

### Basic Whitelist
```javascript
const WHITELIST = ['127.0.0.1', '192.168.1.1'];

const ipWhitelist = (req, res, next) => {
  const clientIp = req.headers['x-forwarded-for'] 
    || req.connection.remoteAddress;
  
  if (!WHITELIST.includes(clientIp)) {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  next();
};
```

### Basic Blacklist
```javascript
const BLACKLIST = ['203.0.113.0', '198.51.100.0'];

const ipBlacklist = (req, res, next) => {
  const clientIp = req.headers['x-forwarded-for'] 
    || req.connection.remoteAddress;
  
  if (BLACKLIST.includes(clientIp)) {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  next();
};
```

### CIDR Range Support
```javascript
const ipaddr = require('ipaddr.js');

const isIpInRange = (ip, cidrRange) => {
  const addr = ipaddr.process(ip);
  const [network, prefix] = cidrRange.split('/');
  
  return addr.match(ipaddr.process(network), parseInt(prefix));
};

const ipWhitelistCIDR = (req, res, next) => {
  const clientIp = req.headers['x-forwarded-for'] 
    || req.connection.remoteAddress;
  
  const WHITELIST = ['192.168.1.0/24', '10.0.0.0/8'];
  
  const allowed = WHITELIST.some(range => 
    isIpInRange(clientIp, range)
  );
  
  if (!allowed) {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  next();
};
```

## Practical Implementations

### Admin Panel Protection
```javascript
const adminIps = ['127.0.0.1', '192.168.1.100'];

app.use('/admin', (req, res, next) => {
  const ip = req.headers['x-forwarded-for'] 
    || req.connection.remoteAddress;
  
  if (!adminIps.includes(ip.split(',')[0].trim())) {
    return res.status(403).json({ error: 'Admin access restricted' });
  }
  
  next();
});
```

### Database Connection Whitelist
```javascript
const dbWhitelist = [
  '10.0.0.5',     // App server
  '10.0.0.6',     // Backup server
  '127.0.0.1'     // Localhost
];

const checkDbAccess = (ip) => {
  return dbWhitelist.includes(ip);
};
```

### Dev/Prod Environment
```javascript
const productionWhitelist = [
  '203.0.113.1',  // Production server
  '203.0.113.2',  // Load balancer
];

const developmentWhitelist = ['127.0.0.1', '192.168.1.0/24'];

const getWhitelist = () => {
  return process.env.NODE_ENV === 'production' 
    ? productionWhitelist 
    : developmentWhitelist;
};
```

## Advanced Features

### Dynamic IP Lists
```javascript
let ipBlacklist = [];

// Update list via admin API
app.post('/admin/blacklist', authenticateAdmin, (req, res) => {
  const { ip } = req.body;
  ipBlacklist.push(ip);
  res.json({ message: 'IP added to blacklist' });
});

// Check against dynamic list
const checkBlacklist = (req, res, next) => {
  const clientIp = req.headers['x-forwarded-for'] 
    || req.connection.remoteAddress;
  
  if (ipBlacklist.includes(clientIp)) {
    return res.status(403).json({ error: 'IP blocked' });
  }
  
  next();
};
```

### IP Logging & Monitoring
```javascript
app.use((req, res, next) => {
  const clientIp = req.headers['x-forwarded-for'] 
    || req.connection.remoteAddress;
  
  // Log all requests with IP
  logger.info('Request', { 
    ip: clientIp, 
    path: req.path, 
    method: req.method 
  });
  
  // Alert on suspicious activity
  if (isKnownAttacker(clientIp)) {
    logger.warn('Blocked known attacker', { ip: clientIp });
  }
  
  next();
});
```

## Real-World Scenarios

### API Rate Limiting by IP
```javascript
const rateLimit = require('express-rate-limit');

// Stricter limits for unknown IPs
const limiter = rateLimit({
  keyGenerator: (req) => {
    const ip = req.headers['x-forwarded-for'] 
      || req.connection.remoteAddress;
    return TRUSTED_IPS.includes(ip) ? 'trusted' : ip;
  },
  windowMs: 15 * 60 * 1000,
  max: (req) => {
    const ip = req.headers['x-forwarded-for'] 
      || req.connection.remoteAddress;
    return TRUSTED_IPS.includes(ip) ? 1000 : 100;
  }
});
```

### DDoS Protection
```javascript
const ddosBlacklist = new Map(); // IP → count

const ddosProtection = (req, res, next) => {
  const ip = req.headers['x-forwarded-for'] 
    || req.connection.remoteAddress;
  
  const count = (ddosBlacklist.get(ip) || 0) + 1;
  ddosBlacklist.set(ip, count);
  
  // Block IPs with >1000 requests/minute
  if (count > 1000) {
    return res.status(429).json({ error: 'Too many requests' });
  }
  
  next();
};
```

## Security Considerations

1. **X-Forwarded-For Spoofing**: Validate proxy headers
2. **IPv6 Support**: Handle both IPv4 and IPv6
3. **Logging**: Track all blocked requests
4. **Updates**: Regularly refresh blacklist
5. **Performance**: Cache IP lookups
6. **Failover**: Default behavior if IP can't be determined
7. **Testing**: Test with VPNs and proxies

## Limitations

- **VPNs/Proxies**: Don't reliably identify users
- **Shared IPs**: May block legitimate users
- **False Positives**: Blocking needed access
- **Maintenance**: Manual IP list updates needed
- **IPv6 Complexity**: Harder than IPv4 management
