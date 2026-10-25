# Cursor-Based Pagination

## What is this?

Cursor-based pagination is a scalable pagination method that uses encoded tokens (cursors) to identify positions in a dataset instead of offset/limit. It's the standard for APIs returning large datasets and is used by Facebook, Twitter, and GitHub.

### Key Features
- **Cursor Encoding/Decoding**: Convert position markers to opaque tokens
- **Relay Format Support**: Compatible with GraphQL Relay specification
- **Stable Iteration**: Works correctly even when data changes
- **Sorting & Filtering**: Combine with sort and filter parameters
- **Keyset Pagination**: Use indexed columns for efficient database queries

## Why does it matter?

### Problems with Offset Pagination
- **Performance degrades** at large offsets (skip N rows always)
- **Inconsistent results** if data changes between requests
- **Inefficient** for large datasets (always reads from start)

### Cursor Pagination Benefits
- **Constant performance** regardless of dataset position
- **Handles real-time updates** gracefully
- **SEO-friendly** with proper link handling
- **Mobile-friendly** with cleaner pagination UI

## How it works

1. **First Request**: Client calls `/api/items?limit=10` (no cursor)
2. **Cursor Generation**: Server encodes last item ID as base64: `eyJpZCI6IjEyMyJ9`
3. **Response Includes**: Items array + `nextCursor` + `hasMore` flag
4. **Next Request**: Client calls `/api/items?limit=10&cursor=eyJpZCI6IjEyMyJ9`
5. **Efficient Query**: Database queries: `WHERE id > cursor_value LIMIT 11`

## Real world usage

- **Social Media**: Twitter, Instagram feed pagination
- **E-commerce**: Amazon product listings
- **Search APIs**: Google search result pagination
- **Message Streams**: Slack/Discord message history
- **Analytics**: Large dataset exploration
