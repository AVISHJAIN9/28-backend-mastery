class AsyncErrorController {
  static async fetchData(req, res) {
    try {
      const data = await Promise.resolve({
        id: 1,
        name: 'Data',
        timestamp: new Date(),
        status: 'success'
      });
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  static async simulateError(req, res) {
    throw new Error('Simulated async error for testing');
  }
}

module.exports = AsyncErrorController;
