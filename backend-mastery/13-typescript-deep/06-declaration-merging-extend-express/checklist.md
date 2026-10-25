# Learning Checklist - Declaration Merging & Extend Express

## Declaration Merging Concepts
- [ ] Understand how TypeScript merges declarations
- [ ] Learn interface merging rules
- [ ] Understand namespace merging
- [ ] Learn function and namespace merging
- [ ] Know when declaration merging is useful
- [ ] Understand order of declaration matters

## Extend Express Request Type
- [ ] Declare global namespace
- [ ] Extend Express.Request interface
- [ ] Add custom properties (userId, metadata, etc.)
- [ ] Add properties in middleware
- [ ] Access extended properties throughout app
- [ ] Verify TypeScript recognizes new properties

## Declaration Merging Patterns
- [ ] Create base Config interface
- [ ] Merge Config with database config
- [ ] Merge Config with server config
- [ ] Create mergeable plugin interfaces
- [ ] Split declarations across files
- [ ] Test that merged config has all properties

## Implementation
- [ ] Write middleware to set userId on request
- [ ] Access req.userId in controllers
- [ ] Add metadata to request object
- [ ] Create type-safe extended request
- [ ] Test that original Express types still work
- [ ] Ensure no conflicts in merged declarations

## Testing & Validation
- [ ] Test that userId is available in routes
- [ ] Test that metadata is available
- [ ] Test middleware properly sets values
- [ ] Test TypeScript completion/intellisense
- [ ] Test requests without values still work
- [ ] Test type checking catches errors

## Edge Cases
- [ ] Handle optional extended properties
- [ ] Test nested property access
- [ ] Test multiple middleware adding properties
- [ ] Test declaration with same name across files
- [ ] Handle conflicts when names overlap
- [ ] Test module augmentation patterns

## Production Readiness
- [ ] Document all extended properties
- [ ] Use module augmentation for plugins
- [ ] Create shared type definition files
- [ ] Ensure extensions don't break imports
- [ ] Test with strict type checking
- [ ] Plan for framework upgrades
