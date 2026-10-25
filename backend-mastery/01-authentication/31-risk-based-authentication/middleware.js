const jwt = require('jsonwebtoken');

// Risk-based authentication middleware
const riskAuthMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    
    // Check if token came from low-risk authentication
    if (decoded.riskLevel && decoded.riskLevel === 'critical') {
      return res.status(403).json({ error: 'Token issued under high risk conditions' });
    }

    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token: ' + err.message });
  }
};

// Check risk level
const checkRiskLevel = (req, res, next) => {
  const riskLevel = req.headers['x-risk-level'];
  
  if (riskLevel === 'critical') {
    return res.status(403).json({ error: 'Cannot proceed from critical risk level' });
  }
  
  next();
};

module.exports = { riskAuthMiddleware, checkRiskLevel };
