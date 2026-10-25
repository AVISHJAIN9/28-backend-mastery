# API Versioning Theory

## Versioning Strategies
- **URL Path**: `/api/v1/users`, `/api/v2/users`
- **Query Parameter**: `?version=2`
- **Header**: `Accept: application/vnd.api+v2+json`
- **Subdomain**: `v1.api.example.com`

## Deprecation Process
1. Release new version
2. Support both old and new (3-6 months)
3. Announce sunset date
4. Remove old version after grace period

## Response Format Evolution
- Add fields (not breaking)
- Rename fields in new version
- Restructure responses (requires new version)
- Remove optional fields (safe)
