const { v4: uuidv4 } = require('uuid');

class GRPCController {
  static async callGRPCService(req, res) {
    try {
      const { service, method, data } = req.body;
      
      const response = {
        id: uuidv4(),
        service,
        method,
        status: 'ok',
        data: data,
        timestamp: new Date()
      };
      
      res.json(response);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  static async listServices(req, res) {
    try {
      res.json({
        services: [
          { name: 'UserService', methods: ['CreateUser', 'GetUser', 'UpdateUser'] },
          { name: 'OrderService', methods: ['CreateOrder', 'GetOrder', 'CancelOrder'] }
        ]
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
}
module.exports = GRPCController;