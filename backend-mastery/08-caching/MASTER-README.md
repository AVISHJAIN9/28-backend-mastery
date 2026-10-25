# Caching Strategies & Patterns

**Module Code:** 08-caching

## What You'll Learn

Redis caching, cache invalidation, TTL, LRU, bloom filters

### Core Topics

- **01 Redis Data Structures** - Practical implementation
- **02 Cache Aside Pattern** - Practical implementation
- **03 Cache Invalidation** - Practical implementation
- **03 Cache Invalidation Strategies** - Practical implementation
- **04 Http Caching Etag Cache Control** - Practical implementation
- **04 Pubsub Pattern** - Practical implementation
- **05 Write Through Caching** - Practical implementation
- **05 Write Through Vs Write Behind** - Practical implementation
- **06 Bloom Filters** - Practical implementation
- **06 Redis Pubsub** - Practical implementation
- **And 3 more topics...**


## Learning Objectives

By completing this module, you will:

✅ Understand core concepts and patterns  
✅ Implement production-ready code  
✅ Best practices and anti-patterns  
✅ Real-world applications  
✅ Performance optimization  
✅ Security considerations  

## Getting Started

### 1. Start with Theory
Read `theory.md` in the first lesson

### 2. Setup Environment
```bash
cd [first-lesson]
npm install
cp .env.example .env
```

### 3. Run Server
```bash
npm run dev
```

### 4. Open React UI
Navigate to http://localhost:3000

### 5. Test Endpoints
Use the interactive UI to test all endpoints

## Lesson Breakdown

| # | Topic | Complexity | Time |
|---|-------|-----------|------|
| 1 | 01 Redis Data Structures | Intermediate | 30 min |
| 2 | 02 Cache Aside Pattern | Intermediate | 30 min |
| 3 | 03 Cache Invalidation | Intermediate | 30 min |
| 4 | 03 Cache Invalidation Strategies | Intermediate | 30 min |
| 5 | 04 Http Caching Etag Cache Control | Intermediate | 30 min |
| 6 | 04 Pubsub Pattern | Intermediate | 30 min |
| 7 | 05 Write Through Caching | Intermediate | 30 min |
| 8 | 05 Write Through Vs Write Behind | Intermediate | 30 min |
| 9 | 06 Bloom Filters | Intermediate | 30 min |
| 10 | 06 Redis Pubsub | Intermediate | 30 min |
| 11 | 07 Lru Eviction | Intermediate | 30 min |
| 12 | 07 Redis Distributed Locks Redlock | Intermediate | 30 min |
| 13 | 08 Redis Cluster | Intermediate | 30 min |


## Architecture

```
08-caching/
├── 01-[lesson]/
│   ├── server.js
│   ├── routes.js
│   ├── controller.js
│   ├── middleware.js
│   ├── schema.js
│   ├── theory.md
│   ├── README.md
│   ├── App.jsx
│   ├── package.json
│   ├── .env.example
│   ├── setup.md
│   └── checklist.md
├── 02-[lesson]/
├── ...
├── INDEX.md
├── MASTER-README.md
└── COMPLETION-SUMMARY.md
```

## Technology Stack

### Backend
- Express.js 4.18+
- Node.js 16+
- Winston / Pino (logging)
- Helmet (security)
- CORS

### Frontend
- React 18
- Fetch API
- CSS3

### Testing
- Manual API testing
- Interactive React UI

## Best Practices

1. **Read theory first** - Understand concepts
2. **Run server** - See it in action
3. **Test endpoints** - Use React UI
4. **Review code** - Study implementations
5. **Modify & experiment** - Learn by doing

## Prerequisites

- Node.js 16+
- npm or yarn
- Basic JavaScript knowledge
- Express.js familiarity
- React fundamentals (for UI)

## Support

- Check theory.md for concepts
- Review README.md for setup
- Look at code comments for implementation
- Follow checklist.md for verification

## Certificate of Completion

Finish all 13 lessons and earn mastery in Caching Strategies & Patterns!
