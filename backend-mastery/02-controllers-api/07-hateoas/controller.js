const { v4: uuidv4 } = require('uuid');

// In-memory data store
const resources = new Map();

class HateoasController {
  // Add HATEOAS links to resource
  static addLinks(resource, baseUrl = 'http://localhost:3000') {
    return {
      ...resource,
      _links: {
        self: { href: `${baseUrl}/hateoas/${resource.id}`, method: 'GET' },
        update: { href: `${baseUrl}/hateoas/${resource.id}`, method: 'PUT' },
        delete: { href: `${baseUrl}/hateoas/${resource.id}`, method: 'DELETE' },
        list: { href: `${baseUrl}/hateoas`, method: 'GET' }
      },
      _actions: {
        canUpdate: true,
        canDelete: true,
        canView: true
      }
    };
  }

  // List all resources with links
  static async list(req, res) {
    try {
      const { page = 1, limit = 10 } = req.query;
      const pageNum = Math.max(1, parseInt(page));
      const pageSize = Math.min(100, Math.max(1, parseInt(limit)));

      const items = Array.from(resources.values());
      const total = items.length;
      const start = (pageNum - 1) * pageSize;
      const paginatedItems = items.slice(start, start + pageSize);

      // Add links to each item
      const itemsWithLinks = paginatedItems.map(item => this.addLinks(item));

      res.json({
        _links: {
          self: { href: `http://localhost:3000/hateoas?page=${pageNum}&limit=${pageSize}`, method: 'GET' },
          create: { href: 'http://localhost:3000/hateoas', method: 'POST' },
          next: pageNum < Math.ceil(total / pageSize) 
            ? { href: `http://localhost:3000/hateoas?page=${pageNum + 1}&limit=${pageSize}`, method: 'GET' }
            : undefined,
          prev: pageNum > 1
            ? { href: `http://localhost:3000/hateoas?page=${pageNum - 1}&limit=${pageSize}`, method: 'GET' }
            : undefined
        },
        data: itemsWithLinks,
        pagination: {
          page: pageNum,
          limit: pageSize,
          total,
          pages: Math.ceil(total / pageSize)
        }
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // Get single resource with links
  static async get(req, res) {
    try {
      const { id } = req.params;

      const resource = resources.get(id);
      if (!resource) {
        return res.status(404).json({ error: 'Resource not found' });
      }

      res.json(this.addLinks(resource));
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // Create new resource
  static async create(req, res) {
    try {
      const { name, description } = req.body;

      if (!name) {
        return res.status(400).json({ error: 'name is required' });
      }

      const id = uuidv4();
      const resource = {
        id,
        name,
        description: description || '',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      resources.set(id, resource);

      res.status(201).json({
        message: 'Resource created successfully',
        ...this.addLinks(resource)
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // Update resource
  static async update(req, res) {
    try {
      const { id } = req.params;
      const { name, description } = req.body;

      const resource = resources.get(id);
      if (!resource) {
        return res.status(404).json({ error: 'Resource not found' });
      }

      if (name !== undefined) resource.name = name;
      if (description !== undefined) resource.description = description;
      resource.updatedAt = new Date();

      resources.set(id, resource);

      res.json({
        message: 'Resource updated successfully',
        ...this.addLinks(resource)
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // Delete resource
  static async delete(req, res) {
    try {
      const { id } = req.params;

      if (!resources.has(id)) {
        return res.status(404).json({ error: 'Resource not found' });
      }

      resources.delete(id);

      res.json({
        message: 'Resource deleted successfully',
        _links: {
          list: { href: 'http://localhost:3000/hateoas', method: 'GET' },
          create: { href: 'http://localhost:3000/hateoas', method: 'POST' }
        }
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // Get available actions
  static async getActions(req, res) {
    try {
      const { id } = req.params;

      const resource = resources.get(id);
      if (!resource) {
        return res.status(404).json({ error: 'Resource not found' });
      }

      res.json({
        resourceId: id,
        availableActions: [
          { action: 'view', href: `http://localhost:3000/hateoas/${id}`, method: 'GET' },
          { action: 'update', href: `http://localhost:3000/hateoas/${id}`, method: 'PUT' },
          { action: 'delete', href: `http://localhost:3000/hateoas/${id}`, method: 'DELETE' }
        ],
        _links: {
          self: { href: `http://localhost:3000/hateoas/${id}`, method: 'GET' },
          list: { href: 'http://localhost:3000/hateoas', method: 'GET' }
        }
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
}

module.exports = HateoasController;
