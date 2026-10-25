// Controller for 08 Gdpr Compliance Basics
// Contains business logic for 08-gdpr-compliance-basics

const items = {};
let nextId = 1;

const controller = {
  getAll: (req, res) => {
    try {
      res.json({
        data: Object.values(items),
        count: Object.keys(items).length
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getOne: (req, res) => {
    try {
      const item = items[req.params.id];
      if (!item) {
        return res.status(404).json({ error: 'Not found' });
      }
      res.json({ data: item });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  create: (req, res) => {
    try {
      const id = nextId++;
      const newItem = {
        id,
        ...req.body,
        createdAt: new Date()
      };
      items[id] = newItem;
      res.status(201).json({ data: newItem });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  update: (req, res) => {
    try {
      const item = items[req.params.id];
      if (!item) {
        return res.status(404).json({ error: 'Not found' });
      }
      const updated = { ...item, ...req.body, updatedAt: new Date() };
      items[req.params.id] = updated;
      res.json({ data: updated });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  delete: (req, res) => {
    try {
      if (!items[req.params.id]) {
        return res.status(404).json({ error: 'Not found' });
      }
      delete items[req.params.id];
      res.json({ message: 'Deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = controller;
