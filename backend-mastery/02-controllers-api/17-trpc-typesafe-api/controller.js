const { v4: uuidv4 } = require('uuid');

const procedures = {
  createItem: async (input) => ({ id: uuidv4(), ...input, createdAt: new Date() }),
  getItem: async (id) => ({ id, name: 'Item' }),
  updateItem: async (id, input) => ({ id, ...input }),
  deleteItem: async (id) => ({ deleted: true })
};

class TRPCController {
  static async handleProcedure(req, res) {
    try {
      const { procedure, input } = req.body;
      
      if (!procedures[procedure]) {
        return res.status(404).json({ error: 'Procedure not found' });
      }
      
      const result = await procedures[procedure](input);
      res.json({ result });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  static async describeProcedures(req, res) {
    try {
      res.json({
        procedures: Object.keys(procedures),
        schema: { input: 'object', output: 'object' }
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
}
module.exports = TRPCController;