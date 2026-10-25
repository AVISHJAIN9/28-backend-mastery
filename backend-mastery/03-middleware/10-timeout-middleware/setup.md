# Setup Guide
## Dependencies
```bash
npm install express
```
## Environment Variables
REQUEST_TIMEOUT=30000
## How to run
```bash
const server = app.listen(3000);
server.setTimeout(30000);
node server.js
```
## How to test
```bash
# Create slow endpoint - should timeout after 30s
curl http://localhost:3000/slow-endpoint
# Should get 408 Request Timeout error
```
