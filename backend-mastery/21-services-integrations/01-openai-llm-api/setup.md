# Setup Guide - OpenAI LLM API Integration

## Step 1: Get OpenAI API Key

1. Go to https://platform.openai.com
2. Sign up or log in to your account
3. Navigate to **API Keys** section
4. Click **Create new secret key**
5. Copy the key (it won't be shown again!)
6. Save it safely

## Step 2: Install Dependencies

```bash
npm install
```

This installs:
- `express` - Web framework
- `axios` - HTTP client
- `cors` - Cross-origin handling
- `helmet` - Security headers
- `dotenv` - Environment variables
- `uuid` - Session IDs
- `joi` - Input validation

## Step 3: Create Environment File

```bash
cp .env.example .env
```

Edit `.env` and add your credentials:

```env
OPENAI_API_KEY=sk-xxxxxxxxxxxxx
HTTP_PORT=6301
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

**Never commit `.env` to Git!** It contains secrets.

## Step 4: Verify Installation

Check that all dependencies are installed:

```bash
node -e "console.log(Object.keys(require('./package.json').dependencies))"
```

Expected output:
```
[ 'axios', 'cors', 'dotenv', 'express', 'helmet', 'uuid' ]
```

## Step 5: Start the Server

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

Expected output:
```
Server running on port 6301
✅ Module: 01 Openai Llm Api
```

## Step 6: Test the Health Endpoint

In another terminal:

```bash
curl http://localhost:6301/health
```

Expected response:
```json
{
  "status": "ok",
  "module": "01 Openai Llm Api",
  "category": "21 Services Integrations",
  "port": 6301,
  "timestamp": "2024-01-15T10:30:45.123Z"
}
```

## Step 7: Start a Chat Session

```bash
curl -X POST http://localhost:6301/api/chat/start
```

Expected response:
```json
{
  "success": true,
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Chat session started"
}
```

Save the `sessionId` for the next test.

## Step 8: Send Your First Message

Replace `{sessionId}` with the ID from step 7:

```bash
curl -X POST http://localhost:6301/api/chat/{sessionId}/message \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello! What can you help me with?",
    "model": "gpt-3.5-turbo"
  }'
```

Expected response:
```json
{
  "success": true,
  "message": "I can help you with a wide variety of tasks...",
  "usage": {
    "prompt_tokens": 12,
    "completion_tokens": 45,
    "total_tokens": 57
  },
  "model": "gpt-3.5-turbo",
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "totalMessages": 2
}
```

## Step 9: View Conversation History

```bash
curl http://localhost:6301/api/chat/{sessionId}/history
```

Expected response shows all messages in the session.

## Step 10: Try Image Generation

```bash
curl -X POST http://localhost:6301/api/images/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A red panda sitting on a tree branch"
  }'
```

Expected response:
```json
{
  "success": true,
  "images": [
    {
      "url": "https://oaidalleapiprodscus.blob.core.windows.net/...",
      "revisedPrompt": "A red panda sitting on a tree branch..."
    }
  ],
  "created": 1234567890
}
```

## Troubleshooting

### Error: "OpenAI API key not configured"

```
❌ OpenAI API key not configured
```

**Fix:**
1. Check `.env` file exists
2. Verify `OPENAI_API_KEY` is set
3. Restart the server: `npm run dev`

### Error: 401 Unauthorized

```
❌ OpenAI authentication failed
```

**Fix:**
1. Go to https://platform.openai.com/api-keys
2. Check if your key is active
3. Generate a new key if needed
4. Update `.env` with the new key
5. Restart the server

### Error: 429 Rate Limited

```
❌ Rate limit exceeded
```

**Fix:**
1. Wait a few minutes before retrying
2. Check your OpenAI usage dashboard
3. Consider upgrading your plan
4. Implement exponential backoff in your code

### Server won't start on port 6301

**Fix:**
1. Check if port is in use: `lsof -i :6301`
2. Kill the process: `kill -9 <PID>`
3. Or change port in `.env`: `HTTP_PORT=6302`

### API returns empty response

**Fix:**
1. Check if `OPENAI_API_KEY` is valid
2. Increase `maxTokens` in the request
3. Try a simpler prompt
4. Check OpenAI service status

## Next: Test with Postman

1. Download Postman: https://www.postman.com/downloads/
2. Import requests:
   - POST: `http://localhost:6301/api/chat/start`
   - POST: `http://localhost:6301/api/chat/:sessionId/message`
   - GET: `http://localhost:6301/api/chat/:sessionId/history`
   - POST: `http://localhost:6301/api/images/generate`
3. Test each endpoint

## Next: Connect Frontend

The React app in `App.jsx` is ready to test:

1. Ensure backend is running on `http://localhost:6301`
2. Start React dev server (adjust port in App.jsx if needed)
3. Open http://localhost:3000
4. Test the UI components

## Complete Workflow

```
1. npm install                    # Install dependencies
2. Create .env                    # Add OPENAI_API_KEY
3. npm run dev                    # Start server
4. curl /health                   # Test health check
5. curl /api/chat/start           # Create session
6. curl /api/chat/X/message       # Send message
7. curl /api/images/generate      # Generate image
```

## Security Checklist

- [ ] `.env` is in `.gitignore`
- [ ] API key is not logged anywhere
- [ ] CORS is configured for frontend
- [ ] Rate limiting is enabled
- [ ] Input validation is in place
- [ ] Error messages don't expose secrets
- [ ] HTTPS ready for production

## Cost Monitoring

OpenAI charges per token:
- **GPT-3.5:** ~$0.0003 per message
- **GPT-4:** ~$0.003 per message  
- **DALL-E:** $0.04-$0.12 per image

Monitor costs:
1. https://platform.openai.com/account/billing/overview
2. Set usage limits to prevent surprise bills
3. Log API calls for internal tracking

## Production Deployment

Before deploying to production:

1. **Database:** Store sessions in MongoDB/PostgreSQL
2. **Authentication:** Add user auth middleware
3. **Rate Limiting:** Implement per-user rate limiting
4. **Monitoring:** Set up error tracking (Sentry)
5. **Logging:** Centralized logs (CloudWatch/Datadog)
6. **Caching:** Redis for session caching
7. **HTTPS:** Use SSL certificates
8. **Cost Control:** Set spending limits
9. **Backups:** Database backups
10. **Testing:** Load testing before launch

## Additional Resources

- OpenAI Docs: https://platform.openai.com/docs
- API Reference: https://platform.openai.com/docs/api-reference
- Pricing: https://openai.com/pricing
- Community: https://community.openai.com
