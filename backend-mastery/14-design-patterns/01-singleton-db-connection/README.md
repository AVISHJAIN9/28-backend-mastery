# Singleton Pattern: Database Connection

## 📚 Module Overview

This module demonstrates the **Singleton Pattern** using a practical database connection example. Learn how to ensure only one instance of a resource exists throughout your application.

## 🎯 What You'll Learn

✅ Understand the Singleton design pattern  
✅ Implement database connection pooling  
✅ Manage shared state safely  
✅ Handle initialization and cleanup  
✅ Implement proper error handling  
✅ Create testable singleton-like structures  

## 🏃 Quick Start

```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env

# Start development server
npm run dev

# Server runs on http://localhost:5601
# Frontend on http://localhost:3000
```

## 📂 Project Structure

```
01-singleton-db-connection/
├── server.js          # Express server with singleton pattern
├── routes.js          # API route definitions
├── controller.js      # Business logic
├── middleware.js      # Custom middleware
├── schema.js          # Data validation schemas
├── App.jsx            # React testing UI
├── package.json       # Dependencies
├── .env.example       # Environment template
└── theory.md          # Pattern explanation
```

## 🔌 API Endpoints

### Database Connection

| Method | Endpoint | Purpose |
|--------|----------|----------|
| `GET` | `/api/connection/status` | Get connection status |
| `POST` | `/api/connection/connect` | Establish connection |
| `POST` | `/api/connection/disconnect` | Close connection |
| `GET` | `/api/connection/info` | Get connection info |

### Data Operations

| Method | Endpoint | Purpose |
|--------|----------|----------|
| `GET` | `/api/users` | Fetch all users |
| `POST` | `/api/users` | Create user |
| `GET` | `/api/users/:id` | Get user by ID |
| `PUT` | `/api/users/:id` | Update user |
| `DELETE` | `/api/users/:id` | Delete user |

## 💡 Key Concepts

### 1. Single Instance
Ensures only one database connection exists:
```javascript
const db1 = Database.getInstance();
const db2 = Database.getInstance();
console.log(db1 === db2); // true
```

### 2. Lazy Initialization
Creates instance only when first needed:
```javascript
static getInstance() {
  if (!Database.instance) {
    Database.instance = new Database();
  }
  return Database.instance;
}
```

### 3. Resource Management
Reuses expensive resources:
```javascript
// One connection for entire app
const db = Database.getInstance();
db.query('SELECT * FROM users');
```

## 🧪 Testing the Pattern

### Using Browser UI
1. Open http://localhost:3000
2. Test connection status
3. Connect/disconnect database
4. Perform CRUD operations
5. Monitor singleton instance behavior

### Using cURL

```bash
# Check connection status
curl http://localhost:5601/api/connection/status

# Connect to database
curl -X POST http://localhost:5601/api/connection/connect

# Get all users
curl http://localhost:5601/api/users

# Create user
curl -X POST http://localhost:5601/api/users \
  -H 'Content-Type: application/json' \
  -d '{"name": "John", "email": "john@test.com"}'
```

## ⚠️ Common Mistakes

| Mistake | Problem | Solution |
|---------|---------|----------|
| Creating multiple instances | Resource waste | Use `getInstance()` |
| Not checking instance | NullPointerException | Check before use |
| Making constructor public | Can create multiple | Make it private |
| No thread safety | Race conditions | Use proper synchronization |
| Hard to test | Can't mock singleton | Use dependency injection |

## 🌍 Real-World Examples

### 1. Database Connection Pooling
Node.js uses singleton pattern for module caching internally. When you require a module, Node.js caches it.

### 2. Logger Instance
Many logging libraries use singleton to ensure single log file.

### 3. Configuration Management
Application configuration often exists as single instance.

### 4. Cache Manager
Cache should be shared across entire application.

## 📊 Performance Notes

- **Single Connection**: ~10-50ms per query
- **Connection Pool (5)**: ~5-20ms per query
- **Multiple Connections (100)**: ~100-500ms (memory waste)

## 🔒 Security Considerations

✅ **Safe**: Centralized connection management  
✅ **Safe**: Single point for security checks  
⚠️ **Caution**: Global access can leak sensitive data  
⚠️ **Caution**: System-wide failures if instance fails  

## 🚀 Advanced Topics

### Connection Pooling
```javascript
class DatabasePool {
  static getInstance() {
    if (!this.instance) {
      this.instance = new DatabasePool();
    }
    return this.instance;
  }
  
  getConnection() {
    // Return from pool
  }
}
```

### Reset for Testing
```javascript
static resetInstance() {
  Database.instance = null;
}

// In tests
beforeEach(() => {
  Database.resetInstance();
});
```

## 📖 Related Patterns

- **Factory Pattern** - Create objects of different types
- **Observer Pattern** - Notify multiple observers
- **Builder Pattern** - Construct complex objects

## ✨ Key Takeaways

1. Singleton ensures **single instance** across app
2. Perfect for **stateful resources** like connections
3. Use **dependency injection** for testability
4. **Avoid** for general business logic
5. Document when class is singleton

## 📚 Further Reading

- [Design Patterns: Singleton](https://www.patterns.dev)
- [JavaScript Design Patterns](https://www.oreilly.com)
- [Node.js Module Caching](https://nodejs.org/api/modules.html)

---

**Module Code**: `14-design-patterns`  
**Lesson**: `01-singleton-db-connection`  
**Status**: ✅ Complete
