const jwt = require('jsonwebtoken');
class AuthController {
  verifyToken(token) { try { return jwt.verify(token, process.env.JWT_SECRET); } catch(e) { return null; }}
  generateToken(userId) { return jwt.sign({userId}, process.env.JWT_SECRET, {expiresIn: '24h'}); }
  handleAuth(socket) { const decoded = this.verifyToken(socket.handshake.auth.token); if(!decoded) throw new Error('Invalid'); socket.userId = decoded.userId; }
}
module.exports = AuthController;