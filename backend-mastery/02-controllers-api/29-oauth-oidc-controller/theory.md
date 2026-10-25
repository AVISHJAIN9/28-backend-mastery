# OAuth/OIDC Theory

## OAuth 2.0 Grant Types
- **Authorization Code**: Web apps (most secure)
- **Client Credentials**: Service-to-service
- **Implicit**: Browser-based apps (deprecated)
- **Resource Owner Password**: Legacy apps

## OpenID Connect
- OpenID Connect = OAuth 2.0 + Identity
- Adds `id_token` with user info
- Enables user claims verification
- Standard claims: email, name, picture

## Security Considerations
- Always validate state parameter
- Use PKCE for mobile/SPA apps
- Store refresh tokens securely
- Validate issuer and audience
