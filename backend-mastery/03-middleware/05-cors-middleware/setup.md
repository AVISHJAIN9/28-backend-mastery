# Setup Guide
## Dependencies
```bash
npm install cors
```
## Environment Variables
CORS_ALLOWED_ORIGINS=http://localhost:3000
## How to run
```bash
const cors = require('cors');
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
node server.js
```
## How to test
```bash
curl -H "Origin: http://localhost:3000" http://localhost:3001
# Should include Access-Control-Allow-Origin header in response
```
