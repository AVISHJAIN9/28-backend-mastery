// ==================== MongoDB & Mongoose Models Controller ====================
// Demonstrates MongoDB document-based operations using Mongoose ODM

const mongoose = require('mongoose');

// ==================== Mongoose Schema Definition ====================

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, maxlength: 100 },
    email: { type: String, required: true, unique: true, lowercase: true },
    age: { type: Number, min: 0, max: 150 },
    role: { type: String, enum: ['user', 'admin', 'moderator'], default: 'user' },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

// Add indexes
userSchema.index({ email: 1 });
userSchema.index({ role: 1, createdAt: -1 });

// Middleware hooks
userSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

userSchema.post('save', function(doc) {
  console.log(`User saved: ${doc._id}`);
});

// Create model
const User = mongoose.model('User', userSchema);

// ==================== CRUD Operations ====================

class MongooseController {
  // CREATE: Insert a new document
  static async create(req, res) {
    try {
      const { name, email, age, role } = req.body;

      // Validation
      if (!name || !email) {
        return res.status(400).json({ error: 'Name and email are required' });
      }

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(409).json({ error: 'Email already exists' });
      }

      // Create new user
      const user = new User({ name, email, age, role });
      await user.save();

      res.status(201).json({
        message: 'User created successfully',
        user: user
      });
    } catch (error) {
      console.error('Create error:', error);
      res.status(500).json({ error: 'Failed to create user', details: error.message });
    }
  }

  // READ: Get all documents with filtering and pagination
  static async getAll(req, res) {
    try {
      const { page = 1, limit = 10, role, isActive } = req.query;
      const skip = (page - 1) * limit;

      // Build filter
      const filter = {};
      if (role) filter.role = role;
      if (isActive !== undefined) filter.isActive = isActive === 'true';

      // Query with pagination
      const users = await User
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      // Get total count
      const total = await User.countDocuments(filter);

      res.json({
        users,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('GetAll error:', error);
      res.status(500).json({ error: 'Failed to fetch users', details: error.message });
    }
  }

  // READ: Get single document by ID
  static async getById(req, res) {
    try {
      const { id } = req.params;

      // Validate MongoDB ObjectId
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid user ID' });
      }

      const user = await User.findById(id);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({ user });
    } catch (error) {
      console.error('GetById error:', error);
      res.status(500).json({ error: 'Failed to fetch user', details: error.message });
    }
  }

  // UPDATE: Modify an existing document
  static async update(req, res) {
    try {
      const { id } = req.params;
      const { name, email, age, role, isActive } = req.body;

      // Validate MongoDB ObjectId
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid user ID' });
      }

      // Check if user exists
      const existingUser = await User.findById(id);
      if (!existingUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Check if new email is already taken
      if (email && email !== existingUser.email) {
        const emailExists = await User.findOne({ email });
        if (emailExists) {
          return res.status(409).json({ error: 'Email already in use' });
        }
      }

      // Update fields
      const updateData = {};
      if (name) updateData.name = name;
      if (email) updateData.email = email.toLowerCase();
      if (age) updateData.age = age;
      if (role) updateData.role = role;
      if (isActive !== undefined) updateData.isActive = isActive;

      const updatedUser = await User.findByIdAndUpdate(id, updateData, { new: true });

      res.json({
        message: 'User updated successfully',
        user: updatedUser
      });
    } catch (error) {
      console.error('Update error:', error);
      res.status(500).json({ error: 'Failed to update user', details: error.message });
    }
  }

  // DELETE: Remove a document
  static async delete(req, res) {
    try {
      const { id } = req.params;

      // Validate MongoDB ObjectId
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid user ID' });
      }

      const deletedUser = await User.findByIdAndRemove(id);

      if (!deletedUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({
        message: 'User deleted successfully',
        user: deletedUser
      });
    } catch (error) {
      console.error('Delete error:', error);
      res.status(500).json({ error: 'Failed to delete user', details: error.message });
    }
  }

  // ==================== Advanced Operations ====================

  // AGGREGATION: Group users by role
  static async aggregateByRole(req, res) {
    try {
      const results = await User.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$role', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);

      res.json({
        message: 'Users grouped by role',
        data: results
      });
    } catch (error) {
      console.error('Aggregation error:', error);
      res.status(500).json({ error: 'Failed to aggregate users', details: error.message });
    }
  }

  // BULK OPERATION: Update multiple users
  static async bulkUpdateRole(req, res) {
    try {
      const { role, newRole } = req.body;

      if (!role || !newRole) {
        return res.status(400).json({ error: 'Role and newRole are required' });
      }

      const result = await User.updateMany(
        { role },
        { role: newRole },
        { new: true }
      );

      res.json({
        message: `Updated ${result.modifiedCount} users`,
        result
      });
    } catch (error) {
      console.error('Bulk update error:', error);
      res.status(500).json({ error: 'Failed to bulk update users', details: error.message });
    }
  }

  // SEARCH: Find users by name (partial match)
  static async search(req, res) {
    try {
      const { query } = req.query;

      if (!query) {
        return res.status(400).json({ error: 'Search query required' });
      }

      const users = await User.find({
        name: { $regex: query, $options: 'i' }
      }).limit(20);

      res.json({
        message: `Found ${users.length} users`,
        users
      });
    } catch (error) {
      console.error('Search error:', error);
      res.status(500).json({ error: 'Search failed', details: error.message });
    }
  }

  // STATS: Get database statistics
  static async stats(req, res) {
    try {
      const stats = {
        totalUsers: await User.countDocuments(),
        totalAdmins: await User.countDocuments({ role: 'admin' }),
        totalModerators: await User.countDocuments({ role: 'moderator' }),
        totalRegularUsers: await User.countDocuments({ role: 'user' }),
        activeUsers: await User.countDocuments({ isActive: true }),
        inactiveUsers: await User.countDocuments({ isActive: false })
      };

      const recentUsers = await User
        .find()
        .sort({ createdAt: -1 })
        .limit(5);

      res.json({
        stats,
        recentUsers
      });
    } catch (error) {
      console.error('Stats error:', error);
      res.status(500).json({ error: 'Failed to fetch stats', details: error.message });
    }
  }

  // EXPORT: Get model for external use
  static getModel() {
    return User;
  }
}

module.exports = MongooseController;

