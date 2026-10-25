# Learning Checklist - Mapped & Template Literal Types

## Mapped Types Concepts
- [ ] Understand mapped type syntax `[K in keyof T]`
- [ ] Learn how to transform property values
- [ ] Understand keyof operator
- [ ] Learn about mapped type modifiers (readonly, ?)
- [ ] Understand as clause for key remapping
- [ ] Learn about conditional mapped types

## Creating Mapped Types
- [ ] Create `Readonly<T>` type
- [ ] Create `Partial<T>` type
- [ ] Create getters object from properties
- [ ] Create event handlers from event map
- [ ] Create API endpoints from route map
- [ ] Combine mapping with conditionals

## Template Literal Types
- [ ] Create event handler names with `on${Capitalize<...>}`
- [ ] Create getter names with `get${Capitalize<...>}`
- [ ] Create setter names with `set${Capitalize<...>}`
- [ ] Combine multiple template literal segments
- [ ] Use union types with template literals
- [ ] Create CSS property getter names

## Implementation
- [ ] Implement User getters via mapped type
- [ ] Implement HTTP method handlers
- [ ] Create event handler map from events
- [ ] Transform User properties to functions
- [ ] Create read-only config type
- [ ] Map database fields to API fields

## Type Safety
- [ ] Verify mapped type keeps all properties
- [ ] Test template literal transforms names correctly
- [ ] Ensure TypeScript catches invalid property names
- [ ] Test key filtering in mapped types
- [ ] Verify conditional transformations work
- [ ] Test readonly enforcement

## Testing & Edge Cases
- [ ] Test mapped type with simple properties
- [ ] Test with nested object properties
- [ ] Test with union type properties
- [ ] Test readonly modifier enforcement
- [ ] Test optional property handling
- [ ] Test key remapping with as clause

## Production Readiness
- [ ] Use mapped types to reduce duplication
- [ ] Create reusable mapped type utilities
- [ ] Document complex mapped types
- [ ] Test performance of complex mappings
- [ ] Ensure mapped types are readable
- [ ] Create tests for type transforms
