# Learning Checklist - Zod Runtime & Compile-time Validation

## Concepts
- [ ] Understand what Zod is and why it's useful
- [ ] Know the difference between runtime and compile-time validation
- [ ] Understand schema definitions
- [ ] Learn about infer for extracting TypeScript types
- [ ] Understand Zod's schema methods (min, max, email, etc.)
- [ ] Learn about optional and nullable fields

## Schema Implementation
- [ ] Create user schema with Zod
- [ ] Define validation rules (email, string length, etc.)
- [ ] Make certain fields optional
- [ ] Create custom error messages
- [ ] Extract TypeScript types from schemas with `z.infer`
- [ ] Create schemas for request validation

## Runtime Validation
- [ ] Implement schema validation in controller
- [ ] Parse request body with schema.parse()
- [ ] Handle validation errors properly
- [ ] Return meaningful error messages
- [ ] Test with invalid inputs
- [ ] Use parseAsync for async validation

## Type Safety
- [ ] Extract types from schemas with `z.infer<typeof schema>`
- [ ] Verify TypeScript knows validated data is safe
- [ ] Use validated types throughout application
- [ ] Eliminate redundant type definitions
- [ ] Test that invalid data is caught at runtime

## Testing & Edge Cases
- [ ] Test valid input passes validation
- [ ] Test invalid email format
- [ ] Test string too short/long
- [ ] Test missing required fields
- [ ] Test string validation rules
- [ ] Test error message clarity

## Production Readiness
- [ ] Document all validation rules
- [ ] Handle validation errors gracefully
- [ ] Log validation failures for security
- [ ] Use strict parsing mode
- [ ] Create reusable schema definitions
- [ ] Test performance of schema validation
