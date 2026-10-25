# Setup Guide
## Dependencies
```bash
npm install express
```
## Environment Variables
None required
## How to run
```bash
const errorHandler = (err, req, res, next) => {
  res.status(err.statusCode || 500).json({ error: err.message });
};
app.use(errorHandler);
node server.js
```
## How to test
```bash
curl http://localhost:3000/users/999
# Should return 404 error in JSON format
```
