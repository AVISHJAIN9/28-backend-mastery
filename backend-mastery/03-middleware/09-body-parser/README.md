# Body Parser Middleware

## What is this?
Body parser middleware parses incoming HTTP request bodies (JSON, URL-encoded, text) and makes data available in req.body for route handlers to use.

## Why does it matter?
- **Data Access**: Makes POST/PUT data accessible
- **Format Support**: Handles multiple content types
- **Automatic Parsing**: No manual string parsing needed
- **Type Coercion**: Converts strings to appropriate types
- **Size Limits**: Prevents malicious large uploads
- **Streaming**: Handles large bodies efficiently

## How it works (step by step)
1. Request arrives with Content-Type header
2. Body parser middleware intercepts request
3. Middleware checks Content-Type
4. JSON parser or URL-encoded parser selected
5. Request body stream read and buffered
6. Body parsed into JavaScript objects
7. Parsed data attached to req.body
8. Route handler receives clean data

## Key concepts
- **Content-Type**: Tells server how data is formatted
- **application/json**: JSON format
- **application/x-www-form-urlencoded**: Form data
- **text/plain**: Plain text
- **Limit**: Max size allowed (default 100KB)
- **Extended**: Use different URL parsing library

## Common mistakes
- Not applying body parser (req.body undefined)
- Parsing before express body-parser
- Not handling content-type mismatches
- Setting limit too high (DOS risk)
- Parsing large file uploads (use multer instead)

## Real world usage
```javascript
const bodyParser = require('body-parser');

// Parse JSON
app.use(bodyParser.json());

// Parse URL-encoded form data
app.use(bodyParser.urlencoded({ extended: true }));

// With size limits
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

// Now route handlers can use req.body
app.post('/users', (req, res) => {
  const { email, password } = req.body;  // Parsed from JSON
  // Process user...
});
```
