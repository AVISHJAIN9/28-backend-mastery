/**
 * Cursor-Based Pagination Controller
 * Efficient pagination using cursor tokens for large datasets
 */
const { v4: uuidv4 } = require('uuid');

// In-memory database
const products = new Map();

class CursorPaginationController {
  /**
   * Get products with cursor-based pagination
   */
  static async getProducts(req, res) {
    try {
      const { first = 10, after, sortBy = 'createdAt', order = 'desc' } = req.query;
      const limit = Math.min(parseInt(first), 100);
      
      let sortedItems = Array.from(products.values())
        .sort((a, b) => {
          const aVal = a[sortBy] || 0;
          const bVal = b[sortBy] || 0;
          return order === 'desc' ? bVal - aVal : aVal - bVal;
        });
      
      let startIdx = 0;
      if (after) {
        const decoded = Buffer.from(after, 'base64').toString('utf-8');
        const afterIdx = sortedItems.findIndex(item => item.id === decoded);
        startIdx = afterIdx >= 0 ? afterIdx + 1 : 0;
      }
      
      const hasMore = startIdx + limit < sortedItems.length;
      const edges = sortedItems.slice(startIdx, startIdx + limit).map(item => ({
        cursor: Buffer.from(item.id).toString('base64'),
        node: item
      }));
      
      res.json({
        pageInfo: {
          hasNextPage: hasMore,
          endCursor: edges.length > 0 ? edges[edges.length - 1].cursor : null,
          totalCount: sortedItems.length
        },
        edges,
        count: edges.length
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  /**
   * Get single product
   */
  static async getProduct(req, res) {
    try {
      const { id } = req.params;
      const product = products.get(id);
      
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }
      
      res.json(product);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  /**
   * Create new product
   */
  static async createProduct(req, res) {
    try {
      const { name, price, description, category } = req.body;
      const id = uuidv4();
      
      const product = {
        id,
        name,
        price: parseFloat(price),
        description,
        category,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      products.set(id, product);
      res.status(201).json(product);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  /**
   * Get users with cursor pagination
   */
  static async getUsers(req, res) {
    try {
      const { first = 20, after } = req.query;
      const limit = Math.min(parseInt(first), 100);
      
      // Mock data
      const users = generateMockUsers(50);
      let startIdx = 0;
      
      if (after) {
        const decoded = Buffer.from(after, 'base64').toString('utf-8');
        startIdx = users.findIndex(u => u.id === decoded) + 1;
      }
      
      const hasMore = startIdx + limit < users.length;
      const edges = users.slice(startIdx, startIdx + limit).map(user => ({
        cursor: Buffer.from(user.id).toString('base64'),
        node: user
      }));
      
      res.json({
        pageInfo: {
          hasNextPage: hasMore,
          endCursor: edges.length > 0 ? edges[edges.length - 1].cursor : null
        },
        edges
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  /**
   * Get with relay cursor format (GraphQL compatible)
   */
  static async getWithRelayCursors(req, res) {
    try {
      const { first = 10, after, last, before } = req.query;
      
      let allItems = Array.from(products.values())
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      let nodes = allItems;
      
      if (after) {
        const decodedAfter = Buffer.from(after, 'base64').toString('utf-8');
        const afterIdx = nodes.findIndex(n => n.id === decodedAfter);
        nodes = nodes.slice(afterIdx + 1);
      }
      
      if (before) {
        const decodedBefore = Buffer.from(before, 'base64').toString('utf-8');
        const beforeIdx = nodes.findIndex(n => n.id === decodedBefore);
        nodes = nodes.slice(0, beforeIdx);
      }
      
      const limit = first ? Math.min(parseInt(first), 100) : parseInt(last) || 10;
      const edges = nodes.slice(0, limit).map((node, idx) => ({
        node,
        cursor: Buffer.from(node.id).toString('base64'),
        offset: idx
      }));
      
      res.json({
        edges,
        pageInfo: {
          hasNextPage: nodes.length > limit,
          hasPreviousPage: false,
          startCursor: edges.length > 0 ? edges[0].cursor : null,
          endCursor: edges.length > 0 ? edges[edges.length - 1].cursor : null
        }
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
}

function generateMockUsers(count) {
  const users = [];
  for (let i = 0; i < count; i++) {
    users.push({
      id: uuidv4(),
      name: `User ${i + 1}`,
      email: `user${i + 1}@example.com`,
      createdAt: new Date()
    });
  }
  return users;
}

module.exports = CursorPaginationController;
