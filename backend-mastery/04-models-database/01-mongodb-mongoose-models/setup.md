# Setup & Installation Guide - MongoDB & Mongoose

## Prerequisites

- **Node.js** 14+ (LTS recommended)
- **npm** or **yarn** package manager  
- **MongoDB** 4.4+ (local or Atlas cloud)
- **Git** (optional, for cloning)

---

## Step 1: Install Dependencies

```bash
# Navigate to the module directory
cd 01-mongodb-mongoose-models

# Install all dependencies
npm install
```

**Dependencies installed:**
- `express` - Web framework
- `mongoose` - MongoDB ODM
- `joi` - Input validation
- `helmet` - Security headers
- `cors` - Cross-origin requests
- `dotenv` - Environment variables
- `winston` - Logging

---

## Step 2: Setup MongoDB

### Option A: MongoDB Atlas (Cloud - Recommended)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account
3. Create a new cluster (M0 free tier)
4. Add your IP to the IP whitelist
5. Create a database user
6. Get the connection string
7. Copy connection string to `.env`

**Connection String Example:**
```
mongodb+srv://username:password@cluster0.mongodb.net/mongodb-models?retryWrites=true&w=majority
```

### Option B: Local MongoDB Installation

**macOS (Homebrew):**
```bash
brew install mongodb-community
brew services start mongodb-community
```

**Windows:**
Download and install from [MongoDB Download Center](https://www.mongodb.com/try/download/community)

**Linux (Ubuntu):**
```bash
sudo apt-get install -y mongodb
sudo systemctl start mongod
```

**Verify Installation:**
```bash
mongosh
> db.version()
```

### Option C: Docker (Quickest)

```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

Verify:
```bash
docker exec mongodb mongosh --eval "db.version()"
```

---

## Step 3: Configure Environment Variables

Create `.env` file from the template:

```bash
cp .env.example .env
```

Edit `.env` with your settings:

```env
# Server Configuration
HTTP_PORT=5101
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/mongodb-models
# Or for Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster0.mongodb.net/mongodb-models?retryWrites=true&w=majority

# Connection Pool
MONGODB_POOL_SIZE=10
MONGODB_TIMEOUT=5000

# Logging
LOG_LEVEL=info
```

---

## Step 4: Verify MongoDB Connection

Create test file `test-connection.js`:

```javascript
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('✓ MongoDB connected successfully');
  process.exit(0);
})
.catch(err => {
  console.error('✗ MongoDB connection failed:', err.message);
  process.exit(1);
});
```

Run test:
```bash
node test-connection.js
```

---

## Step 5: Initialize Database with Sample Data

Create `init-db.js`:

```javascript
require('dotenv').config();
const mongoose = require('mongoose');
const MongooseController = require('./controller');

async function initializeDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('Dropping existing users...');
    const User = MongooseController.getModel();
    await User.deleteMany({});

    console.log('Creating sample users...');
    const sampleUsers = [
      { name: 'Alice Johnson', email: 'alice@example.com', age: 28, role: 'admin' },
      { name: 'Bob Smith', email: 'bob@example.com', age: 35, role: 'moderator' },
      { name: 'Charlie Brown', email: 'charlie@example.com', age: 22, role: 'user' },
      { name: 'Diana Prince', email: 'diana@example.com', age: 31, role: 'admin' },
      { name: 'Eve Wilson', email: 'eve@example.com', age: 26, role: 'user' }
    ];

    const created = await User.insertMany(sampleUsers);
    console.log(`✓ Created ${created.length} users`);

    // Create indexes
    console.log('Creating indexes...');
    await User.collection.createIndex({ email: 1 });
    await User.collection.createIndex({ role: 1, createdAt: -1 });
    console.log('✓ Indexes created');

    console.log('✓ Database initialization complete');
    process.exit(0);
  } catch (error) {
    console.error('✗ Initialization failed:', error.message);
    process.exit(1);
  }
}

initializeDatabase();
```

Run initialization:
```bash
node init-db.js
```

---

## Step 6: Start the Server

```bash
npm start
```

**Expected output:**
```
✓ MongoDB connection established
✓ Server running on http://localhost:5101
✓ Routes registered
```

---

## Step 7: Test the API

### Option A: Using curl

```bash
# Get all users
curl http://localhost:5101/api/users

# Create a user
curl -X POST http://localhost:5101/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Frank","email":"frank@example.com","age":30,"role":"user"}'

# Get user by ID
curl http://localhost:5101/api/users/{userId}

# Update user
curl -X PUT http://localhost:5101/api/users/{userId} \
  -H "Content-Type: application/json" \
  -d '{"age":31}'

# Delete user
curl -X DELETE http://localhost:5101/api/users/{userId}
```

### Option B: Using Python

```python
import requests

BASE_URL = 'http://localhost:5101/api'

# Create user
response = requests.post(f'{BASE_URL}/users', json={
    'name': 'Grace',
    'email': 'grace@example.com',
    'age': 27,
    'role': 'user'
})
print(response.json())

# Get all users
response = requests.get(f'{BASE_URL}/users')
print(response.json())
```

### Option C: Using Postman

1. Import the collection (if provided)
2. Set `{{BASE_URL}}` = `http://localhost:5101`
3. Test endpoints from the collection

---

## Advanced Configuration

### Connection Pooling

Tune pool size in `.env`:
```env
MONGODB_POOL_SIZE=20  # Increase for high-concurrency apps
```

Or configure in code:
```javascript
mongoose.connect(uri, {
  maxPoolSize: 20,
  minPoolSize: 5,
  serverSelectionTimeoutMS: 5000
});
```

### Enable Mongoose Logging

```javascript
mongoose.set('debug', true);
```

Or selective logging:
```javascript
mongoose.set('debug', (coll, method, query) => {
  console.log(`${coll}.${method}(${JSON.stringify(query)})`);
});
```

### Replica Set for Transactions

For local development with transactions:
```bash
mongod --replSet rs0
# In mongosh:
rs.initiate()
```

---

## Troubleshooting

### Connection Refused
**Error:** `connect ECONNREFUSED 127.0.0.1:27017`
- MongoDB not running
- **Solution**: Start MongoDB (`mongod` or `docker run -d -p 27017:27017 mongo`)

### Authentication Failed
**Error:** `authentication failed`
- Wrong credentials
- **Solution**: Check username/password in connection string

### Timeout Error
**Error:** `serverSelectionTimeoutMS expired`
- MongoDB not accessible
- **Solution**: Check network connectivity, IP whitelist (for Atlas)

### E11000 Duplicate Key Error
**Error:** `E11000 duplicate key error`
- Unique constraint violation
- **Solution**: Check if email already exists

### Memory Usage High
- Connection pool too large
- **Solution**: Reduce `maxPoolSize` in settings

---

## Next Steps

1. ✓ Environment setup complete
2. ✓ MongoDB connection verified
3. ✓ Sample data initialized
4. **Next**: Read `theory.md` for concepts
5. **Then**: Explore API endpoints in README.md
6. **Finally**: Run React UI for interactive testing

---

## Support

- [MongoDB Documentation](https://docs.mongodb.com/)
- [Mongoose Documentation](https://mongoosejs.com/)
- [MongoDB Atlas Help](https://www.mongodb.com/docs/atlas/)
- [Common Issues](https://docs.mongodb.com/manual/faq/)
npm run migrate
```

### 5. Start Development Server
```bash
npm start
```

The server will run on `http://localhost:3000`.

## Testing

### Unit Tests
```bash
npm test
```

### Integration Tests
```bash
npm run test:integration
```

### Load Testing
```bash
npm run test:load
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Connection refused | Check database URL and ensure DB is running |
| Authentication failed | Verify username and password |
| Query timeout | Increase timeout or optimize query |
| Connection pool exhausted | Increase pool size or reduce connections |
| Disk full | Clean up old data or expand storage |

## Performance Tuning

1. Enable query logging to find bottlenecks
2. Create indexes on frequently queried columns
3. Use connection pooling
4. Implement caching strategy
5. Monitor metrics (latency, throughput, errors)

## Production Deployment

- Use managed database services (Atlas, RDS, DynamoDB)
- Enable automatic backups
- Configure read replicas for scaling
- Monitor performance metrics
- Set up alerting
- Regular security audits
