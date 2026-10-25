const { v4: uuidv4 } = require('uuid');

const llmRequests = new Map();
const tokenPricing = { 'gpt-4': 0.03, 'gpt-3.5': 0.002 };

class LLMProxyController {
  static async proxyLLMRequest(req, res) {
    try {
      const { model, messages, maxTokens } = req.body;
      const requestId = uuidv4();
      
      const request = {
        id: requestId,
        model,
        inputTokens: messages.reduce((sum, m) => sum + (m.content?.length || 0) / 4, 0),
        outputTokens: maxTokens || 100,
        cost: 0,
        createdAt: new Date()
      };
      
      request.cost = (request.inputTokens + request.outputTokens) * (tokenPricing[model] || 0.01) / 1000;
      llmRequests.set(requestId, request);
      
      res.json({
        id: requestId,
        response: "This is a mock LLM response",
        tokens: request.inputTokens + request.outputTokens,
        cost: request.cost.toFixed(4)
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  static async getLLMStats(req, res) {
    try {
      const stats = {
        totalRequests: llmRequests.size,
        totalCost: Array.from(llmRequests.values()).reduce((sum, r) => sum + r.cost, 0)
      };
      res.json(stats);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
}
module.exports = LLMProxyController;