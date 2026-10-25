const { v4: uuidv4 } = require('uuid');

const subscribers = new Set();

class SSEStreamController {
  static async connectStream(req, res) {
    try {
      const clientId = uuidv4();
      
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      
      subscribers.add({ id: clientId, res });
      
      res.write('data: {"message": "Connected"}\n\n');
      
      req.on('close', () => {
        subscribers.forEach(s => s.id === clientId && subscribers.delete(s));
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  static async broadcastMessage(req, res) {
    try {
      const { message } = req.body;
      subscribers.forEach(client => {
        client.res.write(`data: ${JSON.stringify(message)}\n\n`);
      });
      res.json({ subscribers: subscribers.size });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
}
module.exports = SSEStreamController;