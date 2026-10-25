# Setup Guide
## Dependencies
```bash
npm install helmet
```
## Environment Variables
None required (helmet works with defaults)
## How to run
```bash
const helmet = require('helmet');
app.use(helmet());
node server.js
```
## How to test
```bash
curl -i http://localhost:3000
# Verify security headers in response:
# X-Frame-Options, X-Content-Type-Options, X-XSS-Protection
```
