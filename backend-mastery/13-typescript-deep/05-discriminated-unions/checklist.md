# Learning Checklist - Discriminated Unions

## Concepts
- [ ] Understand discriminated unions (tagged unions)
- [ ] Know the difference vs regular unions
- [ ] Learn how discriminators provide type narrowing
- [ ] Understand exhaustiveness checking
- [ ] Learn about common discriminator patterns
- [ ] Understand literal types as discriminators

## Discriminated Union Patterns
- [ ] Create success union member with `ok: true`
- [ ] Create error union member with `ok: false`
- [ ] Create union combining both members
- [ ] Use type-based discriminator (e.g., `type: 'user' | 'error'`)
- [ ] Create multi-state unions (pending, success, error)
- [ ] Create polymorphic response unions

## Type Narrowing
- [ ] Use `if (result.ok)` to narrow to success type
- [ ] TypeScript auto-completes `data` field in success
- [ ] TypeScript auto-completes `error` field in error
- [ ] Test exhaustiveness with switch statements
- [ ] Use `never` type for unreachable cases
- [ ] Create type guards for unions

## API Implementation
- [ ] Return success response with `ok: true` and data
- [ ] Return error response with `ok: false` and error
- [ ] Handle different error types properly
- [ ] Send correct HTTP status codes
- [ ] Add timestamps to responses
- [ ] Ensure all paths return discriminated union

## Testing & Edge Cases
- [ ] Test success path returns correct structure
- [ ] Test error path returns correct structure
- [ ] Test type narrowing in if/else blocks
- [ ] Test message vs error field handling
- [ ] Test async error handling
- [ ] Test error serialization to JSON

## Production Readiness
- [ ] Use discriminated unions consistently
- [ ] Never return mixed response formats
- [ ] Add helpful error messages
- [ ] Document discriminator invariants
- [ ] Ensure client code handles both cases
- [ ] Monitor which errors occur most frequently
