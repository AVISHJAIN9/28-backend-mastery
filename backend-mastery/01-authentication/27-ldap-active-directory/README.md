# LDAP & Active Directory Authentication

## What is this?

LDAP (Lightweight Directory Access Protocol) and Active Directory (AD) are enterprise directory services that centralize user authentication and authorization. This module demonstrates integrating your backend with existing enterprise directory systems.

## Why does it matter?

- **Enterprise Integration**: Seamlessly integrate with existing company infrastructure
- **Centralized Management**: Single source of truth for user identities and permissions
- **No Password Storage**: Delegate authentication to trusted directory service
- **Group-Based Authorization**: Leverage existing group structures for access control
- **Compliance**: Meet enterprise security and audit requirements
- **Windows Domain Support**: Native integration with Active Directory in Windows environments

## How it works (step by step)

1. **User Submits Credentials**: Username and password sent to backend
2. **LDAP Search**: Backend searches directory for user by UID or email
3. **Bind Operation**: Backend attempts to bind (authenticate) as the user with provided password
4. **Group Lookup**: If successful, fetch user's group memberships
5. **Session Creation**: Create session token for subsequent API calls
6. **Authorization**: Use group membership for role-based access control

## Key concepts

### LDAP (Lightweight Directory Access Protocol)
- Open standard protocol for accessing and maintaining directory information
- Used by Unix/Linux systems, OpenLDAP
- Hierarchical naming structure (Distinguished Names)

### Active Directory (AD)
- Microsoft's implementation of directory services
- Integrated with Windows domains
- Includes additional features like Group Policy

### Distinguished Name (DN)
```
cn=john.smith,ou=engineers,dc=company,dc=com
```
- Unique identifier for an entry in directory
- CN = Common Name
- OU = Organizational Unit
- DC = Domain Component

## Common mistakes

1. **Storing Passwords**: Never store enterprise directory passwords
2. **Incorrect Base DN**: Misconfiguring the search base causes failures
3. **No Connection Pooling**: Creating new connections per request hurts performance
4. **Ignoring Groups**: Not using group-based authorization misses security benefits
5. **Weak Validation**: Not verifying bind success before creating sessions

## Real world usage

- **Enterprise Applications**: Internal tools, dashboards
- **SaaS Multi-Tenant**: AD integration for enterprise SSO
- **Microservices**: Centralized auth for internal service mesh
- **Windows Networks**: Native domain authentication
- **Compliance Systems**: Audit trails for regulatory requirements

## Security Features

✅ **Enterprise Authentication**: Integrate with existing directory service
✅ **No Password Storage**: Passwords verified by directory service
✅ **Group-Based Authorization**: Leverage existing organizational structure
✅ **Session Tokens**: Stateful sessions for API access
✅ **Audit Logging**: Track all authentication attempts
✅ **Connection Pooling**: Secure LDAP connection management
