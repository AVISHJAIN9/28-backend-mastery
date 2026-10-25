// CRUD Controller - Create, Read, Update, Delete operations
const { v4: uuidv4 } = require('uuid');

// In-memory database
const products = new Map();

class CRUDController {
  // CREATE - POST /products
  static async create(req, res) {
    try {
      const { name, price, description, category } = req.body;
      
      if (!name || !price) {
        return res.status(400).json({ error: 'name and price required' });
      }

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

  // READ - GET /products/:id
  static async read(req, res) {
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

  // READ ALL - GET /products
  static async readAll(req, res) {
    try {
      const { limit = 10, offset = 0 } = req.query;
      const items = Array.from(products.values());
      const total = items.length;
      const data = items.slice(offset, offset + limit);

      res.json({
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        data
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // UPDATE - PATCH /products/:id
  static async update(req, res) {
    try {
      const { id } = req.params;
      const product = products.get(id);

      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      // Partial update
      const { name, price, description, category } = req.body;
      if (name) product.name = name;
      if (price) product.price = parseFloat(price);
      if (description) product.description = description;
      if (category) product.category = category;
      product.updatedAt = new Date();

      products.set(id, product);
      res.json(product);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // DELETE - DELETE /products/:id
  static async delete(req, res) {
    try {
      const { id } = req.params;
      const product = products.get(id);

      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      products.delete(id);
      res.status(204).send();
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // BULK DELETE
  static async bulkDelete(req, res) {
    try {
      const { ids } = req.body;
      
      if (!Array.isArray(ids)) {
        return res.status(400).json({ error: 'ids must be array' });
      }

      let deleted = 0;
      ids.forEach(id => {
        if (products.has(id)) {
          products.delete(id);
          deleted++;
        }
      });

      res.json({ deleted, total: ids.length });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
}

module.exports = CRUDController;
