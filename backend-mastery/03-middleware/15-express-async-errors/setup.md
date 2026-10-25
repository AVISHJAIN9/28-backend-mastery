# Setup Guide
## Dependencies
```bash
npm install express-async-errors
```
## Environment Variables
None required
## How to run
```bash
require('express-async-errors');
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
app.get('/users/:id', asyncHandler(async (req, res) => {
  const user = await db.getUser(req.params.id);
  res.json(user);
}));
node server.js
```
## How to test
```bash
curl http://localhost:3000/users/999
# Should get error but server remains running
```
