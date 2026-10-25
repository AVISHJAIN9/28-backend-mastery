const { v4: uuidv4 } = require('uuid');

const documents = new Map();

class SearchController {
  static async searchFullText(req, res) {
    try {
      const { query } = req.body;
      const results = Array.from(documents.values()).filter(doc =>
        doc.title.toLowerCase().includes(query.toLowerCase()) ||
        doc.content.toLowerCase().includes(query.toLowerCase())
      );
      res.json({ results, count: results.length });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  static async searchWithFilters(req, res) {
    try {
      const { query, filters } = req.body;
      let results = Array.from(documents.values());
      
      if (query) {
        results = results.filter(doc =>
          doc.title.toLowerCase().includes(query.toLowerCase())
        );
      }
      
      if (filters?.category) {
        results = results.filter(doc => doc.category === filters.category);
      }
      
      res.json({ results, count: results.length, filters: filters || {} });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  static async indexDocument(req, res) {
    try {
      const { title, content, category } = req.body;
      const id = uuidv4();
      const doc = { id, title, content, category, indexedAt: new Date() };
      documents.set(id, doc);
      res.status(201).json(doc);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
}
module.exports = SearchController;