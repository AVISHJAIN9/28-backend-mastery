# Setup Guide
## Dependencies
```bash
npm install express jsonwebtoken
```
## Environment Variables
JWT_SECRET=your-secret-key
## How to run
```bash
const requireRole = (role) => (req, res, next) => {
  if (req.user.role !== role) return res.status(403).json({ error: 'Access denied' });
  next();
};
app.delete('/users', requireRole('admin'), handler);
node server.js
```
## How to test
```bash
curl -H "Authorization: Bearer {admin_token}" -X DELETE http://localhost:3000/users/1
# Should succeed if token has admin role
```
