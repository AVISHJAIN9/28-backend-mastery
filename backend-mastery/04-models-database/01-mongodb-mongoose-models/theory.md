# MongoDB & Mongoose Models - Theory & Concepts

## Module Overview
This module covers document-based database patterns using MongoDB with Mongoose ODM (Object-Document Mapper). Mongoose provides schema validation, middleware hooks, and type safety for MongoDB operations.

---

## 1. Document-Oriented vs Relational

### Relational Databases
- Strict schema enforcement
- Data normalization (reduced redundancy)
- JOINs for querying related data
- ACID transactions (with constraints)
- Examples: PostgreSQL, MySQL, SQL Server

### Document Databases (MongoDB)
- Flexible, schema-less design
- Data denormalization (nested documents)
- Embedded documents avoid JOINs
- Eventual consistency with replica sets
- Examples: MongoDB, Firebase, CouchDB

### When to Use MongoDB
✓ Rapidly evolving schemas  
✓ Nested hierarchical data  
✓ High-volume reads with simple queries  
✓ Real-time applications with flexible models  
✗ Heavy relational queries  
✗ Complex transactions across collections  

---

## 2. Mongoose Schema Design

### Schema Definition
```javascript
const userSchema = new Schema({
  name: { type: String, required: true, maxlength: 100 },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, minlength: 8 },
  age: { type: Number, min: 18, max: 120 },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  createdAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true }
});
```

### Data Types
- **String**: Text data with optional validation
- **Number**: Integer or decimal values
- **Boolean**: True/false flags
- **Date**: ISO 8601 timestamps
- **ObjectId**: Unique MongoDB identifiers
- **Array**: Lists of values (can be nested)
- **Mixed**: Any data type (use sparingly)
- **Subdocuments**: Nested object structures

### Validation
```javascript
const orderSchema = new Schema({
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ['pending', 'shipped', 'delivered'] }
});
```

---

## 3. Relationships in MongoDB

### Embedded Documents (Denormalization)
```javascript
// One-to-Few: Embed directly
const authorSchema = new Schema({
  name: String,
  books: [{
    title: String,
    published: Date,
    isbn: String
  }]
});
```
**Advantages:** Single query, atomic updates, faster reads  
**Disadvantages:** Duplication, larger documents, complex updates

### References (Normalization)
```javascript
// One-to-Many: Use references
const authorSchema = new Schema({
  name: String,
  bookIds: [Schema.Types.ObjectId]
});

const bookSchema = new Schema({
  title: String,
  authorId: Schema.Types.ObjectId
});
```
**Advantages:** No duplication, flexible updates  
**Disadvantages:** Multiple queries (populate), requires JOINs logic

### Population Pattern
```javascript
const author = await Author.findById(id).populate('bookIds');
// Automatically replaces bookIds with actual book documents
```

---

## 4. CRUD Operations

### Create
```javascript
const user = new User({ name: 'Alice', email: 'alice@example.com' });
await user.save();
// or
const user = await User.create({ name: 'Alice', email: 'alice@example.com' });
```

### Read
```javascript
// Single document
const user = await User.findById(id);
const user = await User.findOne({ email: 'alice@example.com' });

// Multiple documents
const users = await User.find({ role: 'admin' });
const users = await User.find().limit(10).skip(20);

// With population
const author = await Author.findById(id).populate('books');
```

### Update
```javascript
// Method 1: Document update
const user = await User.findById(id);
user.name = 'New Name';
await user.save();

// Method 2: Query update
await User.findByIdAndUpdate(id, { name: 'New Name' }, { new: true });
await User.updateMany({ role: 'user' }, { verified: true });
```

### Delete
```javascript
// Single delete
await User.findByIdAndRemove(id);

// Multiple delete
await User.deleteMany({ isActive: false });
```

---

## 5. Indexing in MongoDB

### Index Types
```javascript
// Single field index
userSchema.index({ email: 1 });
userSchema.index({ createdAt: -1 }); // Descending

// Compound index (multiple fields)
userSchema.index({ email: 1, role: 1 });

// Unique index
userSchema.index({ email: 1 }, { unique: true });

// Text index for full-text search
userSchema.index({ name: 'text', description: 'text' });

// Sparse index (only indexes documents with the field)
userSchema.index({ phone: 1 }, { sparse: true });

// TTL index (auto-delete after expiration)
userSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });
```

### Query Optimization
```javascript
// Index-friendly: Exact match
User.find({ email: 'alice@example.com' });

// Index-friendly: Range query
User.find({ age: { $gt: 18, $lt: 65 } });

// Index-friendly: Sorted and limited
User.find().sort({ createdAt: -1 }).limit(10);

// NOT index-friendly: Regex from start
User.find({ email: /^alice/ }); // Better: User.find({ email: 'alice*' })
```

---

## 6. Aggregation Pipeline

The aggregation pipeline processes documents in stages:

```javascript
// Match → Group → Sort → Limit
const results = await User.aggregate([
  { $match: { isActive: true } },
  { $group: { _id: '$role', count: { $sum: 1 } } },
  { $sort: { count: -1 } },
  { $limit: 5 }
]);

// Example: Revenue by product
const revenue = await Order.aggregate([
  { $match: { status: 'completed' } },
  { $group: {
      _id: '$productId',
      total: { $sum: '$price' },
      count: { $sum: 1 }
    }
  },
  { $sort: { total: -1 } }
]);
```

---

## 7. Middleware (Hooks)

### Pre-hooks (Before operations)
```javascript
userSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    // Hash password before saving
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

userSchema.pre('findOneAndUpdate', async function(next) {
  // Sanitize input data
  const update = this.getUpdate();
  if (update.email) {
    update.email = update.email.toLowerCase();
  }
  next();
});
```

### Post-hooks (After operations)
```javascript
userSchema.post('save', function(doc) {
  console.log(`User saved: ${doc.id}`);
  // Trigger webhook, analytics event, etc.
});

userSchema.post('findOneAndRemove', async function(doc) {
  // Clean up related documents
  await Order.deleteMany({ userId: doc._id });
});
```

---

## 8. Query Helpers

```javascript
// Define custom query methods
userSchema.query.fromCity = function(city) {
  return this.where({ city });
};

// Usage
const users = await User.find().sort({ name: 1 }).fromCity('NYC');
```

---

## 9. Virtual Fields

Virtual fields are computed properties not stored in the database:

```javascript
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

userSchema.virtual('age').get(function() {
  return new Date().getFullYear() - this.birthYear;
});

// Include virtuals in JSON output
userSchema.set('toJSON', { virtuals: true });
```

---

## 10. ACID Properties in Mongoose

Mongoose provides transaction support for multi-document ACID operations:

```javascript
const session = await mongoose.startSession();
session.startTransaction();

try {
  await User.findByIdAndUpdate(userId, { balance: balance - 100 }, { session });
  await Account.findByIdAndUpdate(accountId, { balance: balance + 100 }, { session });
  await session.commitTransaction();
} catch (error) {
  await session.abortTransaction();
  throw error;
} finally {
  session.endSession();
}
```

---

## 11. Connection Management

```javascript
// Basic connection
mongoose.connect('mongodb://localhost:27017/mydb', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000
});

// Connection events
mongoose.connection.on('connected', () => console.log('Connected to MongoDB'));
mongoose.connection.on('error', (err) => console.error('Connection error:', err));
mongoose.connection.on('disconnected', () => console.log('Disconnected'));
```

---

## 12. Best Practices

1. **Schema Design**: Choose embedded vs referenced based on access patterns
2. **Indexing**: Index fields used in queries and sorts
3. **Validation**: Use schema validators for data integrity
4. **Error Handling**: Catch and handle Mongoose validation errors
5. **Population**: Use `.populate()` judiciously to avoid N+1 queries
6. **Transactions**: Use transactions for multi-document operations
7. **Monitoring**: Monitor slow queries and index usage
8. **Connection Pooling**: Configure appropriate pool size

---

## References

- [Mongoose Documentation](https://mongoosejs.com/)
- [MongoDB Manual](https://docs.mongodb.com/manual/)
- [MongoDB Schema Design](https://docs.mongodb.com/manual/core/data-models/)
- [Database Normalization vs Denormalization](https://en.wikipedia.org/wiki/Denormalization)
