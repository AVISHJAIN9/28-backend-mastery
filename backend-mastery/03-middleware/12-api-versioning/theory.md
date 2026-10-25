# Theory & Concepts
## API Versioning Overview
Versioning allows running multiple API versions simultaneously, supporting old clients while introducing breaking changes.

## Why Versioning?
- **Breaking Changes**: Response format changes
- **Deprecated Fields**: Old fields removed
- **New Logic**: Different business logic
- **Migration Time**: Clients need time to update
- **Compatibility**: Support multiple client versions

## Versioning Strategies
1. **URL Path**: /api/v1/users vs /api/v2/users (easiest)
2. **Header**: API-Version: v2 (cleaner URLs)
3. **Query String**: /api/users?version=2 (uncommon)
4. **Subdomain**: v1.api.example.com (infrastructure heavy)

## Version Response Differences
```
v1: { users: [{id: 1, name: 'John'}] }
v2: { data: [{id: 1, name: 'John', email: 'j@example.com'}], total: 1 }
```

## Deprecation Process
1. **Launch**: v2 available alongside v1
2. **Support**: Both versions work simultaneously
3. **Warning**: Include deprecation headers
4. **Timeline**: Announce end-of-life date
5. **Shutdown**: Turn off old version
6. **Monitor**: Alert remaining users

## Maintenance Burden
- Code duplication (each version needs implementation)
- Bug fixes needed in each version
- Testing complexity increases
- Documentation per version required
- Eventually deprecated versions removed

## Best Practices
- Keep versions for 12-24 months
- 2-3 active versions maximum
- Clear deprecation communication
- Provide migration guide
- Monitor v1 usage before shutting down
