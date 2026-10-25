# Setup Guide
## Dependencies
```bash
npm install uuid
```
## Environment Variables
CORRELATION_ID_HEADER=X-Correlation-ID
## How to run
```bash
const { v4: uuidv4 } = require('uuid');
app.use((req, res, next) => {
  req.correlationId = req.get('x-correlation-id') || uuidv4();
  res.set('X-Correlation-ID', req.correlationId);
  next();
});
node server.js
```
## How to test
```bash
curl -i http://localhost:3000/api/test
# Check for X-Correlation-ID header in response
```
