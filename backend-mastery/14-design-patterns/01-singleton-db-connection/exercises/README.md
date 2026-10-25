# Singleton Pattern - Exercises

## Exercise 1: Implement Logger Singleton
Create a Logger singleton that:
- Maintains a single instance across the app
- Tracks log count
- Has methods: log(), warn(), error()
- Returns instance via getInstance()

**Hint:** Similar to DatabaseConnection example, use static getInstance() method

---

## Exercise 2: Config Manager Singleton
Build a ConfigManager singleton that:
- Loads configuration once from environment variables
- Caches the config
- Provides getConfig(key) method
- Prevents duplicate config loads

**Questions to answer:**
1. Why is singleton useful here instead of just exporting an object?
2. How would you prevent the config from being modified after initialization?

---

## Exercise 3: Session Tracker
Implement a SessionTracker singleton that:
- Tracks all active user sessions in a Map
- addSession(userId, sessionData)
- removeSession(userId)
- getSessions()
- getSessionCount()

**Challenge:** How would you handle cleanup of expired sessions?

---

## Exercise 4: Fix the Memory Leak
This code has a singleton problem. Find and fix it:

```javascript
class CacheManager {
  static instance = null;
  
  constructor() {
    this.cache = new Map();
  }
  
  getInstance() {
    if (!this.instance) {
      this.instance = new CacheManager();
    }
    return this.instance;
  }
}

const cache1 = new CacheManager().getInstance();
const cache2 = new CacheManager().getInstance();
console.log(cache1 === cache2); // Should be true but isn't!
```

---

## Exercise 5: Lazy Initialization
Modify the basic singleton example to:
- Only create database connection when first getInstance() is called
- Add initialization parameters (host, port, username)
- Throw error if getInstance() called with different parameters a second time

---

## Solutions
See `../../solutions/` folder for detailed solutions with explanations.
