# Rate Limiting Setup

## Installation
```bash
npm install express-rate-limit
```

## Basic Configuration
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later'
});

app.use(limiter);
```

## Per-Route Limiting
Apply different limits to different routes like login (stricter) vs general API

## Testing
Use Apache Bench or curl to test:
```bash
for i in {1..101}; do curl http://localhost:4016/api/test; done
```
