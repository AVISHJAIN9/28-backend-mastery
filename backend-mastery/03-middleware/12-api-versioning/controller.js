class VersioningController {
  static getVersion(req, res) {
    const version = req.params.version || 'v1';
    const features = {
      v1: ['Basic CRUD', 'Simple Auth', 'REST endpoints'],
      v2: ['Enhanced CRUD', 'Advanced Auth', 'Webhooks', 'Async operations'],
      v3: ['Everything in v2', 'GraphQL support', 'Real-time streaming', 'Advanced caching']
    };
    
    res.json({
      version,
      features: features[version] || [],
      deprecated: version === 'v1'
    });
  }
}

module.exports = VersioningController;
