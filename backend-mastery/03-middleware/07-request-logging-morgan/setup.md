# Setup Guide
## Dependencies
```bash
npm install morgan
```
## Environment Variables
LOG_FORMAT=dev
LOG_FILE=access.log
## How to run
```bash
const morgan = require('morgan');
app.use(morgan('dev'));
node server.js
```
## How to test
```bash
curl http://localhost:3000/api/test
# Check console output shows request details
```
