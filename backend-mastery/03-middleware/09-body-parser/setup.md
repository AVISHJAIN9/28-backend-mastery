# Setup Guide
## Dependencies
```bash
npm install body-parser
```
## Environment Variables
BODY_LIMIT=10mb
## How to run
```bash
const bodyParser = require('body-parser');
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));
node server.js
```
## How to test
```bash
curl -X POST http://localhost:3000/users -H "Content-Type: application/json" -d '{"name": "John"}'
# req.body should contain parsed data
```
