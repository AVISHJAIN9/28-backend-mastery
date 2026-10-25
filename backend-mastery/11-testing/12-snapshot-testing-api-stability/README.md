# 12 - Snapshot Testing & API Stability

## Overview
Capture API responses as snapshots and detect unintended changes using snapshot testing.

## What You'll Learn
- **Snapshot Testing** - Capture expected output
- **Snapshot Files** - Version controlled snapshots
- **Update Strategy** - When to update
- **API Stability** - Detect breaking changes
- **Serialization** - Handling dynamic data
- **Regression Detection** - Catch unintended changes

## Key Concepts

### What is a Snapshot?
```javascript
expect(apiResponse).toMatchSnapshot();

// Generates __snapshots__/api.test.js.snap
exports[`API response 1`] = `
{
  "id": 1,
  "name": "Alice",
  "createdAt": "2024-01-15T10:00:00Z"
}
`;
```

### Snapshot Flow
1. First run - Creates snapshot
2. Subsequent runs - Compare to snapshot
3. Change detected - Review diff
4. Accept change - Update snapshot
5. Reject change - Revert code

## Benefits
1. Document API structure
2. Catch breaking changes
3. Detect schema drift
4. Prevent regressions
5. Faster than assertions

## Challenges
1. **Dynamic Data** - Dates, IDs, timestamps
2. **Snapshot Size** - Large responses
3. **False Positives** - Expected changes
4. **Review Burden** - Many snapshots

## Solutions
1. **Serializers** - Normalize data
2. **Property Matchers** - Flexible matching
3. **Inline Snapshots** - Readable tests
4. **Partial Snapshots** - Key fields only

## Best Practices
- Version control snapshots
- Review snapshot changes
- Normalize dynamic data
- Test realistic responses
- Keep snapshots small
- Document why changes

## Common Patterns
1. API contract snapshots
2. Error response shapes
3. Paginated data
4. Nested objects
5. Array structures

## Integration
- CI/CD validation
- Regression detection
- API documentation
- Breaking change alerts
- Team consistency
