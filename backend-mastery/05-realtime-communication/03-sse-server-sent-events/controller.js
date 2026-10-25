class SSEController {
  constructor() { this.clients = new Map(); }
  addClient(userId, res) { this.clients.set(userId, res); res.write(':connected\n\n'); }
  broadcast(event, data) { this.clients.forEach(res => res.write(`data: ${JSON.stringify({event,data})}\n\n`)); }
  removeClient(userId) { this.clients.delete(userId); }
}
module.exports = SSEController;