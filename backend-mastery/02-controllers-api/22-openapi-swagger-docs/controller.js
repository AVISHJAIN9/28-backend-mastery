const { v4: uuidv4 } = require('uuid');

class OpenAPIController {
  static async getOpenAPISpec(req, res) {
    try {
      const spec = {
        openapi: '3.0.0',
        info: { title: 'Backend Mastery API', version: '1.0.0' },
        paths: {
          '/items': {
            get: { operationId: 'listItems', responses: { 200: { description: 'List of items' } } },
            post: { operationId: 'createItem', responses: { 201: { description: 'Item created' } } }
          },
          '/items/{id}': {
            get: { operationId: 'getItem', responses: { 200: { description: 'Item details' } } }
          }
        }
      };
      res.json(spec);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  static async getSwaggerUI(req, res) {
    try {
      const html = '<html><head><title>Swagger UI</title></head><body><h1>API Documentation</h1></body></html>';
      res.send(html);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
}
module.exports = OpenAPIController;