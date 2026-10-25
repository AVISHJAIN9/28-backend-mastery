# Learning Checklist - Utility Types: Partial, Pick, Omit

## Utility Types Concepts
- [ ] Understand `Partial<T>` - make all properties optional
- [ ] Understand `Pick<T, K>` - select specific properties
- [ ] Understand `Omit<T, K>` - exclude specific properties
- [ ] Learn `Required<T>` - make all properties required
- [ ] Learn `Readonly<T>` - make properties readonly
- [ ] Understand `Record<K, T>` - create objects with specific keys

## Schema Implementation
- [ ] Create base User type with all properties
- [ ] Create UserUpdate type using `Partial<User>`
- [ ] Create UserCreate type using `Omit<User, 'id'>`
- [ ] Create UserPreview type using `Pick<User, ...>`
- [ ] Create UserDTO with specific fields only
- [ ] Combine multiple utility types together

## Route Implementation
- [ ] Create GET endpoint returning full User
- [ ] Create PATCH endpoint accepting `Partial<User>`
- [ ] Create POST endpoint using `Omit<User, 'id'>`
- [ ] Create preview endpoint using `Pick<User, ...>`
- [ ] Keep POST responses consistent
- [ ] Handle partial update logic correctly

## Type Safety
- [ ] Verify Partial allows only User properties
- [ ] Verify Pick selects correct fields only
- [ ] Verify Omit excludes correct fields
- [ ] Test that invalid keys are rejected by TypeScript
- [ ] Ensure readonly fields can't be modified
- [ ] Test nested utility type combinations

## Testing & Edge Cases
- [ ] Test updating single field with Partial
- [ ] Test updating multiple fields
- [ ] Test that id can't be updated
- [ ] Test creating user without id
- [ ] Test Pick correctly filters fields
- [ ] Test Omit correctly excludes fields

## Production Readiness
- [ ] Use Partial for update operations
- [ ] Use Omit for create operations
- [ ] Use Pick for API DTOs/responses
- [ ] Document which types are used where
- [ ] Reduce code duplication with utilities
- [ ] Create consistent response types
