# Setup Guide
## Dependencies
```bash
npm install joi
```
## Environment Variables
None required
## How to run
```bash
const Joi = require('joi');
const schema = Joi.object({ email: Joi.string().email().required() });
app.post('/users', validateMiddleware(schema), handler);
node server.js
```
## How to test
```bash
curl -X POST http://localhost:3000/users -H "Content-Type: application/json" -d '{"email": "invalid"}'
# Should return validation error
```
