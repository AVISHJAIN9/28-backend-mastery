# Cursor-Based Pagination - Theory & Implementation

## Pagination Methods Comparison

### 1. Offset-Based (Traditional)
```
GET /api/items?page=3&limit=10
SELECT * FROM items OFFSET 20 LIMIT 10
```
**Pros**: Simple, good for small datasets
**Cons**: Slow with large offsets, inconsistent with updates

### 2. Cursor-Based (Modern)
```
GET /api/items?limit=10&cursor=abc123
SELECT * FROM items WHERE id > last_id LIMIT 11
```
**Pros**: Fast, consistent, handles updates
**Cons**: Slightly more complex

## Cursor Encoding

### Simple Implementation
```javascript
// Encode cursor
const cursor = Buffer.from(JSON.stringify({ id: 123 })).toString('base64');
// Result: eyJpZCI6IDEyM30

// Decode cursor
const { id } = JSON.parse(Buffer.from(cursor, 'base64').toString());
```

### Response Structure
```json
{
  "data": [
    { "id": 1, "name": "Item 1" },
    { "id": 2, "name": "Item 2" },
    ...
    { "id": 10, "name": "Item 10" }
  ],
  "pageInfo": {
    "hasNextPage": true,
    "endCursor": "eyJpZCI6IDEwfQ==",
    "totalCount": 1000
  }
}
```

## Keyset Pagination Query

```javascript
// Forward pagination
const getItems = async (limit, cursor) => {
  let query = db.from('items').limit(limit + 1);
  
  if (cursor) {
    const { id } = decodeCursor(cursor);
    query = query.where('id', '>', id);
  }
  
  const items = await query.orderBy('id', 'asc');
  
  // Check if has next page
  const hasMore = items.length > limit;
  if (hasMore) items.pop(); // Remove extra item
  
  const nextCursor = items.length > 0 
    ? encodeCursor({ id: items[items.length - 1].id })
    : null;
  
  return { items, nextCursor, hasMore };
};
```

## Backward Pagination

```javascript
// Previous page (reverse iteration)
const getPreviousItems = async (limit, cursor) => {
  // Reverse query direction
  const items = await db.from('items')
    .where('id', '<', decodeCursor(cursor).id)
    .orderBy('id', 'desc')
    .limit(limit)
    .select();
  
  return items.reverse(); // Restore correct order
};
```

## Sorting with Cursors

```javascript
// Multi-field cursor for complex sorting
const cursor = encodeCursor({
  createdAt: item.createdAt,
  id: item.id  // Tiebreaker
});

// Query with sort
const query = db.from('items')
  .where('createdAt', '<=', cursorData.createdAt)
  .andWhere('id', '<', cursorData.id)  // If createdAt equal
  .orderBy('createdAt', 'desc')
  .orderBy('id', 'desc');
