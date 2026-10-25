# Setup Guide
## Dependencies
```bash
npm install compression
```
## Environment Variables
COMPRESSION_LEVEL=6
COMPRESSION_THRESHOLD=1024
## How to run
```bash
const compression = require('compression');
app.use(compression({ threshold: 1024, level: 6 }));
node server.js
```
## How to test
```bash
curl -H "Accept-Encoding: gzip" -i http://localhost:3000
# Check for Content-Encoding: gzip header in response
```
