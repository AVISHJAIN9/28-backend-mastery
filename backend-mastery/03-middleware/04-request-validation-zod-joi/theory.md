# Theory & Concepts
## Request Validation Overview
Validation schemas define expected data structure, types, and constraints. Middleware validates incoming requests before handlers process them.

## Why Validate?
- Prevents invalid data from reaching handlers
- Provides security (SQL injection, NoSQL injection prevention)
- Improves code clarity (handlers know data is valid)
- Better error messages to clients
- Single place to define requirements

## Schema Types (Joi Example)
- **String**: text data with optional constraints (min length, email format, regex)
- **Number**: numeric data with min/max
- **Boolean**: true/false
- **Date**: date objects
- **Array**: lists of items
- **Object**: nested objects

## Validation Rules
- **.required()**: Field must be present
- **.optional()**: Field can be omitted
- **.email()**: Must be valid email format
- **.min(n)**: Minimum length or value
- **.max(n)**: Maximum length or value
- **.regex()**: Must match regex pattern
- **.custom()**: Custom validation function

## Error Handling
Validation fails: Return 400 Bad Request with detailed error messages. Success: Modified req.body passed to handler.

## Libraries
- **Joi**: Most popular, great error messages
- **Zod**: Type-safe, TypeScript focused
- **Yup**: Lightweight alternative
