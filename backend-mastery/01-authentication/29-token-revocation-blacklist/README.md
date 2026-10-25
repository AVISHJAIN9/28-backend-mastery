# Token Revocation & Blacklist

## What is this?

Token revocation allows you to invalidate JWTs before their natural expiration. Combined with a blacklist, you can immediately logout users and prevent token reuse after compromise.

## Why does it matter?

- **Immediate Logout**: Revoke tokens instantly without waiting for expiration
- **Breach Response**: Quickly blacklist compromised tokens
- **Session Termination**: Force logout across all devices
- **Access Control**: Remove access without code changes
- **Compliance**: Meet regulatory requirements for instant access revocation

## How it works

1. User logs out or token is compromised
2. Token added to revocation blacklist
3. On next request, token checked against blacklist
4. Blacklisted token rejected immediately
5. Periodic cleanup removes expired tokens from blacklist

## Key concepts

- **Blacklist**: Set of revoked tokens that are invalidated
- **Whitelist**: Alternative approach - only allow specific tokens
- **Cleanup**: Remove expired tokens to prevent memory leaks
- **Revocation Reason**: Track why token was revoked

## Real world usage

- **Multi-device Logout**: Revoke tokens on all devices
- **Compromised Token Response**: Immediately blacklist leaked token
- **Access Removal**: Revoke access when user permissions change
- **Session Management**: Clean logout from all sessions
