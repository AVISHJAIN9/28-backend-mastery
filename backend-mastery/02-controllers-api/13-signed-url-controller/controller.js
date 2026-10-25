const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

const signedUrls = new Map();

class SignedURLController {
  static generateSignedURL(req, res) {
    try {
      const { resource, expiresIn = 3600 } = req.body;
      const secret = process.env.SIGNING_SECRET || 'secret';
      const timestamp = Date.now();
      const expiresAt = timestamp + (expiresIn * 1000);
      
      const data = `${resource}:${expiresAt}`;
      const signature = crypto.createHmac('sha256', secret).update(data).digest('hex');
      const signedUrl = `${resource}?sig=${signature}&exp=${expiresAt}`;
      
      const url = { id: uuidv4(), signedUrl, resource, expiresAt, createdAt: new Date() };
      signedUrls.set(url.id, url);
      
      res.json(url);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  static verifySignedURL(req, res) {
    try {
      const { resource, sig, exp } = req.query;
      const secret = process.env.SIGNING_SECRET || 'secret';
      
      if (Date.now() > exp) return res.status(401).json({ error: 'URL expired' });
      
      const data = `${resource}:${exp}`;
      const expectedSig = crypto.createHmac('sha256', secret).update(data).digest('hex');
      
      if (sig === expectedSig) {
        res.json({ valid: true, resource });
      } else {
        res.status(401).json({ error: 'Invalid signature' });
      }
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
}
module.exports = SignedURLController;