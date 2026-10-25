# LDAP Setup Guide

## Prerequisites

- Node.js >= 14
- npm or yarn
- Access to LDAP or Active Directory server
- LDAP credentials (admin or service account)
- LDAP client tools (optional): `ldapsearch`, `ldapmodify`

## Step 1: Install Dependencies

```bash
cd 27-ldap-active-directory

npm install express ldapjs uuid joi cors dotenv morgan bcryptjs
```

## Step 2: Configure LDAP Connection

### Gather LDAP Information

```bash
# Test connection
ldapsearch -x -H ldap://your-ldap-server:389 -b "" -s base namingContexts

# This will show you the baseDn
```

### Create .env file

```bash
cp .env.example .env
```

Update `.env` with your LDAP details:

**For OpenLDAP:**
```
LDAP_URL=ldap://ldap.example.com:389
LDAP_BASE_DN=dc=example,dc=com
LDAP_BIND_DN=cn=admin,dc=example,dc=com
LDAP_BIND_PASSWORD=admin_password
NODE_ENV=development
PORT=3000
```

**For Active Directory:**
```
LDAP_URL=ldap://dc01.company.local:389
LDAP_BASE_DN=dc=company,dc=local
LDAP_BIND_DN=CN=Service Account,CN=Users,DC=company,DC=local
LDAP_BIND_PASSWORD=service_password
AD_DOMAIN=COMPANY
NODE_ENV=development
PORT=3000
```

## Step 3: Test LDAP Connection

### Using ldapsearch

```bash
# Test anonymous bind
ldapsearch -x -H ldap://your-ldap-server:389 \
  -b "dc=company,dc=com" -s base

# Test authenticated bind
ldapsearch -x -H ldap://your-ldap-server:389 \
  -D "cn=admin,dc=company,dc=com" \
  -w "password" \
  -b "dc=company,dc=com" \
  "(objectClass=*)"

# Search for users
ldapsearch -x -H ldap://your-ldap-server:389 \
  -b "ou=people,dc=company,dc=com" \
  "(uid=john.smith)"

# Get group members
ldapsearch -x -H ldap://your-ldap-server:389 \
  -b "ou=groups,dc=company,dc=com" \
  "cn=engineers"
```

## Step 4: Create Server File

**server.js**
```javascript
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const ldapRoutes = require('./routes');

app.use(express.json());
app.use(cors());
app.use('/ldap', ldapRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'ldap-auth' });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`✅ LDAP Auth Server running on http://localhost:${port}`);
  console.log(`   LDAP Server: ${process.env.LDAP_URL}`);
  console.log(`   Base DN: ${process.env.LDAP_BASE_DN}`);
});
```

## Step 5: Start Server

```bash
node server.js
```

Output:
```
✅ LDAP Auth Server running on http://localhost:3000
   LDAP Server: ldap://ldap.example.com:389
   Base DN: dc=example,dc=com
```

## API Testing

### Login

```bash
curl -X POST http://localhost:3000/ldap/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john.smith",
    "password": "user_password"
  }'
```

Response:
```json
{
  "message": "Login successful",
  "sessionToken": "abc123...",
  "user": {
    "id": "uuid-123",
    "username": "john.smith",
    "email": "john@company.com",
    "fullName": "John Smith",
    "groups": ["engineers", "developers"]
  },
  "expiresIn": 86400
}
```

### Search Users

```bash
curl -X GET \
  "http://localhost:3000/ldap/search?query=john&limit=10" \
  -H "Authorization: Bearer <sessionToken>"
```

### Get Current User

```bash
curl -X GET http://localhost:3000/ldap/me \
  -H "Authorization: Bearer <sessionToken>"
```

### Get User Groups

```bash
curl -X GET http://localhost:3000/ldap/groups \
  -H "Authorization: Bearer <sessionToken>"
```

### Change Password

```bash
curl -X POST http://localhost:3000/ldap/change-password \
  -H "Authorization: Bearer <sessionToken>" \
  -H "Content-Type: application/json" \
  -d '{
    "oldPassword": "current_password",
    "newPassword": "new_password"
  }'
```

### Logout

```bash
curl -X POST http://localhost:3000/ldap/logout \
  -H "Authorization: Bearer <sessionToken>"
```

## Common LDAP Configurations

### OpenLDAP Example

```
LDAP_URL=ldap://ldap.example.com:389
LDAP_BASE_DN=dc=example,dc=com

# User search: cn=*,ou=people,dc=example,dc=com
# Group search: cn=*,ou=groups,dc=example,dc=com
```

### Active Directory Example

```
LDAP_URL=ldap://dc01.company.local:389
LDAP_BASE_DN=DC=company,DC=local

# User search: CN=*,CN=Users,DC=company,DC=local
# Group search: CN=*,OU=Groups,DC=company,DC=local
```

## Troubleshooting

### "LDAP Server is Temporarily Unavailable"

```bash
# Verify server is reachable
ping ldap.example.com

# Test port connectivity
nc -zv ldap.example.com 389

# Check firewall rules
sudo ufw allow 389/tcp
```

### "Invalid Credentials"

```bash
# Verify bind DN format
# OpenLDAP: cn=admin,dc=example,dc=com
# AD: CN=admin,CN=Users,DC=example,DC=local

# Test manually
ldapsearch -x -H ldap://server:389 \
  -D "cn=admin,dc=example,dc=com" \
  -w "password" \
  -b "dc=example,dc=com" -s base
```

### "No Such Object"

```bash
# Verify base DN
ldapsearch -x -H ldap://server:389 -b "" -s base namingContexts

# List directory structure
ldapsearch -x -H ldap://server:389 \
  -b "dc=example,dc=com" -s base
```

## Production Deployment

1. **Use LDAPS (Secure LDAP)**
   ```bash
   LDAP_URL=ldaps://ldap.example.com:636
   ```

2. **Connection Pooling**: Implement connection caching

3. **Monitoring**
   - Monitor LDAP server availability
   - Log authentication attempts
   - Alert on failed binds

4. **Security**
   - Never hardcode credentials
   - Use environment variables or secrets management
   - Implement rate limiting
   - Use strong passwords for service accounts

5. **Performance**
   - Cache user/group lookups
   - Monitor query performance
   - Implement pagination for large searches
