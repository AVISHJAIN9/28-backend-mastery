# JWT Key Rotation

## What is this?

JWT Key Rotation is a security mechanism that periodically replaces the cryptographic keys used to sign JWTs. This prevents long-term key compromise from impacting all issued tokens and enables automated key management without downtime.

## Why does it matter?

- **Zero-Downtime Updates**: Rotate keys without invalidating existing tokens
- **Key Compromise Mitigation**: Limit damage if a key is compromised
- **Regulatory Compliance**: Meet requirements for regular key rotation
- **Automated Management**: Remove manual key management burden
- **Smooth Transitions**: Grace period allows clients to update their key caches

## How it works

1. **Issue Tokens**: Sign tokens with current active key, include key ID (kid) in header
2. **Monitor Expiry**: Track key age and schedule rotation before expiry
3. **Generate New Key**: Create new RSA key pair
4. **Deprecate Old Key**: Mark previous key as deprecated (but valid for grace period)
5. **Activate New Key**: New tokens use new key immediately
6. **Grace Period**: Old key remains valid for N hours/days for client transition
7. **Cleanup**: After grace period, remove deprecated keys

## Key concepts

- **Key ID (kid)**: Unique identifier in JWT header identifying which key signed it
- **Algorithm**: Usually RS256 (RSA with SHA-256)
- **Grace Period**: Time clients have to update key cache before old keys expire
- **Active**: Currently used for signing new tokens
- **Deprecated**: Old key valid during grace period
- **Retired**: Old key no longer valid

## Real world usage

- **Microservices**: Distributed systems validating tokens against shared key set
- **SaaS Platforms**: Serving millions of users with automatic key rotation
- **Financial Services**: Regulatory compliance for key management
- **Cloud Native Apps**: Kubernetes clusters with automatic key rotation
