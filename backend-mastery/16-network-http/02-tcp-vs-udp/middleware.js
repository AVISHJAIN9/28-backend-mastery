// Connection tracking middleware
const activeConnections = new Map();

const connectionTracker = (req, res, next) => {
  const connId = `${Date.now()}-${Math.random()}`;
  req.connectionId = connId;
  
  activeConnections.set(connId, {
    startTime: Date.now(),
    protocol: req.query.protocol || 'TCP',
    path: req.path
  });

  res.on('finish', () => {
    const conn = activeConnections.get(connId);
    if (conn) {
      conn.duration = Date.now() - conn.startTime;
      conn.endTime = Date.now();
    }
  });

  next();
};

// Packet logger middleware
const packetLogger = (req, res, next) => {
  const originalJson = res.json;
  res.json = function(data) {
    console.log(`[${req.connectionId}] Packet: ${JSON.stringify(data).substring(0, 100)}`);
    return originalJson.call(this, data);
  };
  next();
};

// Protocol validator middleware
const protocolValidator = (req, res, next) => {
  const protocol = req.query.protocol || req.body?.protocol;
  if (protocol && !['TCP', 'UDP'].includes(protocol)) {
    return res.status(400).json({ error: 'Invalid protocol. Use TCP or UDP' });
  }
  next();
};

module.exports = {
  connectionTracker,
  packetLogger,
  protocolValidator,
  activeConnections
};

