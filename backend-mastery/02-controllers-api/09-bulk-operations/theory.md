# Bulk Operations - Theory & Implementation

## Request Format

```json
POST /api/bulk/delete

{
  "operation": "delete",
  "ids": ["id1", "id2", "id3", ...],
  "options": {
    "atomic": true,
    "batchSize": 100
  }
}
```

## Chunking Strategy

```javascript
const processBulk = async (items, batchSize = 100) => {
  const results = [];
  
  // Split into chunks
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    
    try {
      // Process batch in transaction
      const batchResult = await db.transaction(async (trx) => {
        return Promise.all(
          batch.map(item => trx('items').insert(item))
        );
      });
      
      results.push(...batchResult);
    } catch (error) {
      results.push({ error: error.message, batch });
    }
  }
  
  return results;
};
```

## Validation Before Bulk Operations

```javascript
const validateBulkRequest = async (items) => {
  const errors = [];
  
  items.forEach((item, index) => {
    const { error } = schema.validate(item);
    if (error) {
      errors.push({
        index,
        item,
        error: error.message
      });
    }
  });
  
  if (errors.length > 0) {
    throw new BulkValidationError(
      `${errors.length}/${items.length} items invalid`,
      errors
    );
  }
};
```

## Transaction Patterns

### Atomic (All-or-Nothing)
```javascript
// Either all succeed or all fail
const result = await db.transaction(async (trx) => {
  return Promise.all(
    items.map(item => trx('products').insert(item))
  );
});
// If any insert fails, entire transaction rolled back
```

### Non-Atomic (Continue on Error)
```javascript
// Process as many as possible, collect errors
const results = [];

for (const item of items) {
  try {
    const result = await db('products').insert(item);
    results.push({ success: true, result });
  } catch (error) {
    results.push({ success: false, error: error.message, item });
  }
}

return results;
```

## Response Format

```json
{
  "operation": "create",
  "total": 1000,
  "successful": 950,
  "failed": 50,
  "errors": [
    {
      "index": 5,
      "item": { "name": "Product" },
      "error": "Duplicate entry for SKU"
    }
  ]
}
```
