# Module 01: MongoDB & Mongoose Models

## Overview
This module demonstrates MongoDB document-based database patterns using Mongoose ODM (Object-Document Mapper). Learn how to design schemas, perform CRUD operations, use indexes, and implement advanced Mongoose features for production applications.

**Database:** MongoDB  
**ODM:** Mongoose  
**Pattern:** Document-oriented with schema validation  
**Complexity:** Beginner to Intermediate

---

## Key Concepts

### 1. Document-Oriented Data Model
MongoDB stores data as flexible JSON-like documents instead of rigid relational tables.
- No predefined schema required upfront
- Fields can vary between documents
- Nested documents support complex hierarchies
- Arrays support multiple values

### 2. Mongoose Schema Layer
Mongoose adds schema validation and type safety to MongoDB:
```javascript
const userSchema = new Schema({
  name: String,
  email: { type: String, required: true, unique: true },
  age: { type: Number, min: 18 }
});
```

### 3. Relationships
- **Embedded Documents**: Data nested directly in documents (denormalization)
- **References**: Store ObjectId references to other documents (normalization)
- **Population**: Automatically load referenced documents

### 4. Indexes
Create indexes on frequently queried fields:
- Single field indexes
- Compound indexes (multi-column)
- Unique indexes
- Text indexes for full-text search
- TTL indexes for automatic expiration

---

## Project Structure

```
01-mongodb-mongoose-models/
├── controller.js       # Mongoose CRUD operations
├── routes.js          # Express routes
├── middleware.js      # Error handling
├── schema.js          # Joi validation schemas
├── server.js          # Express app setup
├── App.jsx            # React testing UI
├── package.json       # Dependencies
├── .env.example       # Environment template
├── setup.md           # Installation guide
└── theory.md          # Conceptual explanations
```

---

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Create a `.env` file:
```env
HTTP_PORT=5101
MONGODB_URI=mongodb://localhost:27017/mongodb-models
NODE_ENV=development
```

### 3. Start MongoDB
```bash
# Using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Or local installation
mongod
```

### 4. Start the Server
```bash
npm start
```

Server runs on `http://localhost:5101`

---

## API Endpoints

### Create User
```http
POST /api/users
Content-Type: application/json

{
  "name": "Alice Johnson",
  "email": "alice@example.com",
  "age": 25,
  "role": "admin"
}
```
**Response:** `201 Created`

### Get All Users
```http
GET /api/users?page=1&limit=10&role=admin
```

### Get User by ID
```http
GET /api/users/:id
```

### Update User
```http
PUT /api/users/:id
Content-Type: application/json

{
  "age": 26,
  "role": "moderator"
}
```

### Delete User
```http
DELETE /api/users/:id
```

### User Statistics
```http
GET /api/users/stats
```

### Aggregate by Role
```http
GET /api/users/aggregate/role
```

### Search Users
```http
GET /api/users/search?query=alice
```

---

## Code Examples

### Define Schema with Mongoose
```javascript
const userSchema = new mongoose.Schema({
  name: { type: String, required: true, maxlength: 100 },
  email: { type: String, required: true, unique: true, lowercase: true },
  age: { type: Number, min: 18, max: 150 },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  createdAt: { type: Date, default: Date.now }
});

// Add index
userSchema.index({ email: 1 });

// Create model
const User = mongoose.model('User', userSchema);
```

### Create a Document
```javascript
const user = new User({
  name: 'Alice',
  email: 'alice@example.com',
  age: 25
});

await user.save();
```

### Find Documents
```javascript
// Find all
const users = await User.find();

// Find with filter
const admins = await User.find({ role: 'admin' });

// Find one
const user = await User.findOne({ email: 'alice@example.com' });

// Find by ID
const user = await User.findById(userId);
```

### Update a Document
```javascript
// Update and return new document
const updated = await User.findByIdAndUpdate(
  userId,
  { age: 26 },
  { new: true }
);
```

### Delete a Document
```javascript
const deleted = await User.findByIdAndRemove(userId);
```

### Aggregation Pipeline
```javascript
const stats = await User.aggregate([
  { $match: { isActive: true } },
  { $group: { _id: '$role', count: { $sum: 1 } } },
  { $sort: { count: -1 } }
]);
```

---

## MongoDB vs Mongoose

| Feature | MongoDB | Mongoose |
|---------|---------|----------|
| Connection | Direct driver | Simplified API |
| Schema | Optional | Required |
| Validation | Manual | Built-in validators |
| Population | Manual joins | Automatic with `.populate()` |
| Middleware | Limited | Pre/post hooks |
| Type Safety | Dynamic | TypeScript support |

---

## Best Practices

1. **Schema Design**
   - Use embedded documents for related data accessed together
   - Use references when data is accessed independently
   - Keep documents under 16MB

2. **Indexing**
   - Index fields used in queries and sorts
   - Avoid indexing low-cardinality fields
   - Monitor index usage

3. **Validation**
   - Validate user input before database operations
   - Use Mongoose validators for consistency
   - Implement business logic validation

4. **Error Handling**
   - Catch validation errors
   - Handle connection errors
   - Log errors for debugging

5. **Query Optimization**
   - Use `.limit()` for large result sets
   - Use `.select()` to retrieve specific fields
   - Use `.lean()` for read-only queries

6. **Connection Management**
   - Configure connection pooling
   - Set appropriate timeouts
   - Handle connection errors gracefully

---

## Performance Optimization

### Compound Indexes
```javascript
// Query: Find active users created after date, sorted by name
userSchema.index({ isActive: 1, createdAt: -1, name: 1 });
```

### Sparse Indexes
```javascript
// Only index documents with the field
userSchema.index({ phone: 1 }, { sparse: true });
```

### TTL Indexes
```javascript
// Auto-delete documents after 24 hours
userSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });
```

### Using .lean()
```javascript
// Faster for read-only queries (50-70% faster)
const users = await User.find().lean();
```

---

## Common Issues & Solutions

| Problem | Cause | Solution |
|---------|-------|----------|
| `E11000 duplicate key error` | Unique constraint violated | Check for existing values |
| `CastError` | Invalid ObjectId format | Validate ID format |
| `ValidationError` | Schema validation failed | Check required fields |
| `Connection timeout` | MongoDB not running | Start MongoDB service |
| `N+1 queries` | Loading related data inefficiently | Use `.populate()` or aggregation |

---

## Testing with React UI

The `App.jsx` component provides an interactive UI to:
- Create new users
- List all users with pagination
- View user details
- Update user information
- Delete users
- Search users
- View statistics

Access at: `http://localhost:3000`

---

## Related Learning Paths

- **Next Step**: Module 02 (ACID Transactions) - Multi-document transactions
- **Intermediate**: Module 12 (Indexes) - Advanced indexing strategies
- **Advanced**: Module 10 (N+1 Problem) - Query optimization

---

## Resources

- [Mongoose Documentation](https://mongoosejs.com/)
- [MongoDB Manual](https://docs.mongodb.com/manual/)
- [MongoDB Schema Design](https://docs.mongodb.com/manual/core/data-models/)
- [Performance Best Practices](https://docs.mongodb.com/manual/administration/optimization/)

---

## Checklist

- [ ] MongoDB installed and running
- [ ] Dependencies installed (`npm install`)
- [ ] Environment variables configured
- [ ] Server starting without errors
- [ ] API endpoints responding
- [ ] React UI loading (if frontend running)
- [ ] CRUD operations working
- [ ] Indexes created
- [ ] Error handling tested
- [ ] Performance monitoring setup
