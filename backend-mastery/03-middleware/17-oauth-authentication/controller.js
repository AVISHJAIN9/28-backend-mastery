class AuthController {
  static async login(req, res) {
    return res.json({ success: true, message: 'Login successful', user: req.user || { id: 1, name: 'Test User' } });
  }
  
  static async logout(req, res) {
    return res.json({ success: true, message: 'Logged out' });
  }
  
  static async profile(req, res) {
    return res.json({ success: true, user: req.user || { id: 1, name: 'Test User' } });
  }
}

module.exports = AuthController;
