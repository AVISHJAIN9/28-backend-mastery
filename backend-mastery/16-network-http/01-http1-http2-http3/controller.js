// Controller for HTTP versions module

// Get protocol information
const getProtocolInfo = (req, res) => {
  const httpVersion = req.httpVersion;
  
  const protocolData = {
    HTTP_VERSION: {
      '1.0': {
        name: 'HTTP/1.0',
        year: 1996,
        features: ['Basic requests/responses', 'No persistence', 'No compression', 'No multiplexing'],
        maxConnections: 1,
        latency: 'High (new connection per request)',
        useCase: 'Legacy systems'
      },
      '1.1': {
        name: 'HTTP/1.1',
        year: 1997,
        features: ['Keep-Alive', 'Chunked transfer', 'Compression', 'Pipelining', 'Virtual hosts'],
        maxConnections: 6,
        latency: 'Medium (reuses connections)',
        useCase: 'Traditional web applications'
      },
      '2': {
        name: 'HTTP/2',
        year: 2015,
        features: ['Multiplexing', 'Server push', 'Header compression (HPACK)', 'Binary protocol', 'Stream prioritization'],
        maxConnections: 1,
        latency: 'Low (single connection)',
        useCase: 'Modern web applications'
      },
      '3': {
        name: 'HTTP/3',
        year: 2022,
        features: ['QUIC protocol', 'UDP-based', 'Faster handshake', 'Connection migration', 'Better mobile support'],
        maxConnections: 1,
        latency: 'Very Low (0-RTT handshake)',
        useCase: 'Latest applications, mobile-first'
      }
    }
  };

  res.json({
    clientHttpVersion: `HTTP/${httpVersion}`,
    protocolInfo: protocolData.HTTP_VERSION,
    headers: req.headers
  });
};

// Compare protocols
const compareProtocols = (req, res) => {
  const comparison = {
    'HTTP/1.0 vs 1.1': {
      introduced: '1997',
      improvements: ['Persistent connections', 'Virtual hosting', 'Compression', 'Better caching'],
      performance_improvement: '~20-30%'
    },
    'HTTP/1.1 vs 2': {
      introduced: '2015',
      improvements: ['Multiplexing', 'Server push', 'Header compression', 'Binary framing'],
      performance_improvement: '~50-70%'
    },
    'HTTP/2 vs 3': {
      introduced: '2022',
      improvements: ['QUIC (UDP)', 'Faster handshake', 'Connection migration', 'Improved mobile'],
      performance_improvement: '~20-40% (especially mobile)'
    }
  };

  res.json(comparison);
};

// Simulate multiplexing (HTTP/2 feature)
const getMultiplexDemo = (req, res) => {
  const httpVersion = req.httpVersion;
  
  if (httpVersion === '1.1') {
    // HTTP/1.1: Sequential requests needed
    return res.json({
      protocol: 'HTTP/1.1',
      connectionModel: 'Sequential',
      description: 'Requests must be sent one after another. Even with pipelining, responses must arrive in order.',
      demo: 'Open DevTools Network tab to see requests waiting for previous response',
      requests: 3,
      approximateTime: '300ms (100ms + 100ms + 100ms)'
    });
  }

  // HTTP/2: True multiplexing
  res.json({
    protocol: 'HTTP/2',
    connectionModel: 'Multiplexed',
    description: 'All requests sent on same connection simultaneously, responses come back in any order.',
    demo: 'Open DevTools Network tab to see all requests parallel',
    requests: 3,
    approximateTime: '110ms (all parallel + 10ms overhead)'
  });
};

// Simulate server push
const getServerPushDemo = (req, res) => {
  const httpVersion = req.httpVersion;

  if (parseInt(httpVersion) < 2) {
    return res.json({
      protocol: `HTTP/${httpVersion}`,
      supportsPush: false,
      description: 'Server push not available',
      workaround: 'Inline CSS/JS or use Resource Hints (preload, prefetch)',
      example: '<link rel="preload" href="style.css" as="style">'
    });
  }

  res.json({
    protocol: `HTTP/${httpVersion}`,
    supportsPush: true,
    description: 'Server can push resources proactively',
    benefits: ['Faster page load', 'No roundtrip needed', 'Better cache utilization'],
    example: 'Server pushes CSS and JS before client even requests them'
  });
};

// Get performance characteristics
const getPerformanceData = (req, res) => {
  const performanceData = {
    metrics: {
      'Connection Setup Latency': {
        'HTTP/1.0': '3-way handshake + overhead',
        'HTTP/1.1': '3-way handshake (reusable)',
        'HTTP/2': '3-way handshake (single stream)',
        'HTTP/3': '0-RTT or 1-RTT (QUIC)'
      },
      'Header Compression': {
        'HTTP/1.0': '0% (none)',
        'HTTP/1.1': '0% (plain text)',
        'HTTP/2': '~90% (HPACK)',
        'HTTP/3': '~90% (QPACK)'
      },
      'Request Parallelization': {
        'HTTP/1.0': 'No (1 request per connection)',
        'HTTP/1.1': 'Limited (pipelining, ~6 parallel)',
        'HTTP/2': 'Yes (unlimited multiplexed)',
        'HTTP/3': 'Yes (unlimited multiplexed)'
      },
      'Average Page Load (10 MB)': {
        'HTTP/1.0': '~2500ms',
        'HTTP/1.1': '~800ms',
        'HTTP/2': '~300ms',
        'HTTP/3': '~200ms'
      }
    },
    browserSupport: {
      'HTTP/1.0': 'All (deprecated)',
      'HTTP/1.1': 'All modern browsers',
      'HTTP/2': 'All modern browsers, 95%+ coverage',
      'HTTP/3': 'Chrome 43+, Edge 79+, Firefox 88+, ~80% coverage'
    }
  };

  res.json(performanceData);
};

module.exports = {
  getProtocolInfo,
  compareProtocols,
  getMultiplexDemo,
  getServerPushDemo,
  getPerformanceData
};

