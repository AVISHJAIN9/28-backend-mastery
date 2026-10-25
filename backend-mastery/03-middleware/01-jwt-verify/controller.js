const jwt = require('jsonwebtoken');

class JWTVerifyController {
  static async verifyJWT(req, res) {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) return res.status(401).json({ error: 'No token provided' });

      const secret = process.env.JWT_SECRET || 'your_secret_key';
      const decoded = jwt.verify(token, secret);
      
      res.json({ decoded, message: 'Token valid' });
    } catch (err) {
      res.status(401).json({ error: 'Invalid token', details: err.message });
    }
  }

  static async generateJWT(req, res) {
    try {
      const { userId, email, role } = req.body;
      const secret = process.env.JWT_SECRET || 'your_secret_key';
      
      const token = jwt.sign(
        { userId, email, role },
        secret,
        { expiresIn: '24h' }
      );
      
      res.json({ token, expiresIn: '24h' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  static async refreshJWT(req, res) {
    try {
      const { refreshToken } = req.body;
      const secret = process.env.JWT_SECRET || 'your_secret_key';
      
      const decoded = jwt.verify(refreshToken, secret);
      const newToken = jwt.sign(
        { userId: decoded.userId, email: decoded.email, role: decoded.role },
        secret,
        { expiresIn: '24h' }
      );
      
      res.json({ token: newToken, expiresIn: '24h' });
    } catch (err) {
      res.status(401).json({ error: 'Invalid refresh token' });
    }
  }
}

module.exports = JWTVerifyController;
