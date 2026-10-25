const bodyParser = require('body-parser');

class BodyParserController {
  static getConfig(req, res) {
    res.json({
      jsonLimit: '10mb',
      urlencodedLimit: '10mb',
      textLimit: '5mb',
      formats: ['application/json', 'application/x-www-form-urlencoded', 'text/plain']
    });
  }

  static handleBody(req, res) {
    res.json({ parsedBody: req.body, contentType: req.get('content-type') });
  }
}

module.exports = BodyParserController;
