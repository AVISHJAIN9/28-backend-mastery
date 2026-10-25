# LDAP & Active Directory Deep Dive

## Directory Structure

### LDAP Tree Format
```
dc=company,dc=com
  ├── ou=people
  │   ├── uid=john.smith
  │   └── uid=jane.doe
  ├── ou=groups
  │   ├── cn=engineers
  │   └── cn=managers
  └── ou=services
      └── cn=app-service
```

### Distinguished Names (DNs)
- Unique path to an entry in the directory
- Read from right to left: `cn=john.smith,ou=people,dc=company,dc=com`
- Case-insensitive but conventionally lowercase
- Used for bind operations (authentication)

## LDAP Operations

### Search Operation
```javascript
// Search for user
const filter = '(uid=john.smith)';
const baseDn = 'ou=people,dc=company,dc=com';

client.search(baseDn, { filter, scope: 'sub' }, (err, res) => { ... });
```

### Bind Operation (Authentication)
```javascript
// Authenticate as user
const userDn = 'uid=john.smith,ou=people,dc=company,dc=com';
const password = 'user_password';

client.bind(userDn, password, (err) => {
  if (err) {
    // Authentication failed
  } else {
    // Authentication successful
  }
});
```

### Modify Operation (Change Password)
```javascript
// Requires admin/service account privileges
const change = new ldap.Change({
  operation: 'replace',
  modification: {
    userPassword: newPassword
  }
});

client.modify(userDn, change, (err) => { ... });
```

## Active Directory vs LDAP

| Feature | LDAP | Active Directory |
|---------|------|------------------|
| Protocol | Open standard | Proprietary (LDAP-based) |
| OS | Linux, Unix, macOS | Windows domains |
| Features | Basic directory | Advanced (GPO, Kerberos) |
| Search | Flexible filters | LDAP subset |
| Groups | Nested support | Native nested groups |
| Integration | Custom | OS-integrated |

## LDAP Authentication Flow

### Bind After Search Pattern
```
1. Anonymous Bind (optional)
   Client --BIND--> LDAP Server
   
2. Search for User
   Client --SEARCH--> LDAP Server
   Server returns user DN
   
3. Bind as User
   Client --BIND(userDN, password)--> LDAP Server
   
4. Auth Success
   Server returns success/failure
```

### Bind Before Search Pattern
```
1. Direct Bind as Service Account
   Client --BIND(serviceDN, password)--> LDAP Server
   
2. Search for User (as service account)
   Client --SEARCH--> LDAP Server
   
3. Bind as User (in same connection)
   Client --BIND(userDN, password)--> LDAP Server
```

## Group-Based Authorization

### Group Membership Models

#### Dynamic Groups (LDAP)
```
cn=engineers,ou=groups,dc=company,dc=com
  memberUid: john.smith
  memberUid: jane.doe
```

#### Static Groups (AD)
```
cn=Engineers,ou=Groups,dc=company,dc=com
  member: cn=john.smith,ou=Users,dc=company,dc=com
  member: cn=jane.doe,ou=Users,dc=company,dc=com
```

### RBAC Implementation
```javascript
// Check if user is in group
async function hasGroupAccess(userDn, groupName) {
  const groupDn = `cn=${groupName},ou=groups,dc=company,dc=com`;
  const filter = `(|(member=${userDn})(memberUid=*${extractUID(userDn)}*))`;
  
  // Search in group
  return searchInGroup(groupDn, filter);
}

// Use in middleware
app.get('/admin', requireGroup('administrators'), (req, res) => {
  // Admin-only endpoint
});
```

## Connection Management

### Connection Pooling
```javascript
// Reuse connections for better performance
const client = ldap.createClient({
  url: 'ldap://ldap.company.com:389',
  timeout: 5000,
  connectTimeout: 10000,
  maxConnections: 10
});

// Unbind when done
client.unbind((err) => { ... });
```

### Error Handling
```javascript
// Common LDAP errors
const errors = {
  'INVALID_CREDENTIALS': 'Wrong password',
  'NO_SUCH_OBJECT': 'User not found',
  'UNAVAILABLE': 'LDAP server down',
  'TIMEOUT': 'Connection timeout',
  'REFERRAL': 'Referral to other server'
};
```

## Security Considerations

### Secure LDAP (LDAPS)
```javascript
// Use TLS for encryption
const client = ldap.createClient({
  url: 'ldaps://ldap.company.com:636',  // Port 636 for secure
  tlsOptions: {
    rejectUnauthorized: false
  }
});
```

### Service Account
```javascript
// Use dedicated unprivileged account for searches
const serviceDn = 'cn=app-service,ou=services,dc=company,dc=com';
const servicePassword = process.env.LDAP_SERVICE_PASSWORD;

// Bind as service account for searches
client.bind(serviceDn, servicePassword, (err) => { ... });

// Don't expose service credentials
```

### Password Protection
```javascript
// Never log or transmit passwords in plain text
// Verify passwords through LDAP bind only
// Never store LDAP passwords in application
```

## Troubleshooting

### Common Issues

#### "Invalid Credentials"
- Verify username spelling
- Check user exists in directory
- Verify Active Directory distinguishedName vs LDAP uid field
- Test manually with `ldapsearch` command

#### "No Such Object"
- Check baseDn is correct
- Verify organizational unit (OU) path exists
- Check LDAP browser to verify structure

#### "Referral"
- Server reporting referral to another server
- Follow referral with reconnect
- Or adjust LDAP configuration

#### "Connection Timeout"
- LDAP server unreachable
- Firewall blocking port (389/636)
- Network issues
- Increase timeout value

### Debugging Commands

```bash
# Test LDAP connection
ldapsearch -x -H ldap://ldap.company.com -b "dc=company,dc=com" -s base

# Search for user
ldapsearch -x -H ldap://ldap.company.com \
  -b "ou=people,dc=company,dc=com" \
  -D "uid=john.smith,ou=people,dc=company,dc=com" \
  -W "(uid=john.smith)"

# Get group members
ldapsearch -x -H ldap://ldap.company.com \
  -b "ou=groups,dc=company,dc=com" \
  "cn=engineers"
```

## Performance Optimization

### Connection Caching
```javascript
class LDAPConnectionPool {
  constructor(config) {
    this.pool = [];
    this.config = config;
  }
  
  async getConnection() {
    if (this.pool.length > 0) {
      return this.pool.pop();
    }
    return ldap.createClient(this.config);
  }
  
  releaseConnection(client) {
    this.pool.push(client);
  }
}
```

### Result Caching
```javascript
// Cache LDAP search results with TTL
const userCache = new Map(); // user cache

async function getUserFromCache(username, ttl = 3600) {
  if (userCache.has(username)) {
    const entry = userCache.get(username);
    if (Date.now() - entry.time < ttl * 1000) {
      return entry.data;
    }
  }
  
  const user = await searchLdapUser(username);
  userCache.set(username, { data: user, time: Date.now() });
  return user;
}
```

## Best Practices

1. **Use Service Accounts**: Don't bind as user for all operations
2. **Implement Caching**: Cache directory lookups to reduce server load
3. **Connection Pooling**: Reuse LDAP connections
4. **Error Handling**: Handle referrals and retries
5. **TLS Encryption**: Use LDAPS for sensitive environments
6. **Audit Logging**: Log all authentication attempts
7. **Password Policy**: Enforce password requirements through AD/LDAP
8. **Group Hygiene**: Keep groups updated and meaningful
