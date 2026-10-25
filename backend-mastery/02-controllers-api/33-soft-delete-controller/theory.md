# Soft Delete Theory

## Hard vs Soft Delete
- **Hard Delete**: Record physically removed (irreversible)
- **Soft Delete**: Field marked deleted (reversible)

## Implementation
- Add `deleted_at` timestamp field
- Query excludes deleted: `WHERE deleted_at IS NULL`
- Restore sets deleted_at back to NULL
- Permanently purge after retention period

## Considerations
- Index on deleted_at for performance
- Unique constraints must consider soft deletes
- Foreign keys may need ON DELETE SET NULL
- Retention policies for GDPR compliance
