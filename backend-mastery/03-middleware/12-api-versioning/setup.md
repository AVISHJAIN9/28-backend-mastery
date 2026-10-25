# Setup Guide
## Dependencies
```bash
npm install express
```
## Environment Variables
DEFAULT_API_VERSION=v2
## How to run
```bash
const versionMiddleware = (req, res, next) => {
  req.apiVersion = req.params.version || 'v2';
  next();
};
app.get('/api/:version/users', versionMiddleware, handler);
node server.js
```
## How to test
```bash
curl http://localhost:3000/api/v1/users
curl http://localhost:3000/api/v2/users
# Different responses for different versions
```
