# 01 - OpenAI LLM API Integration

Integrate OpenAI's powerful language models (GPT-4, GPT-3.5) and image generation (DALL-E) into your Node.js backend.

## Features

✅ **Chat Completions** - Multi-turn conversations with message history  
✅ **Text Completions** - Single-prompt text generation  
✅ **Image Generation** - Create images with DALL-E  
✅ **Session Management** - Persistent conversation sessions  
✅ **Cost Tracking** - Monitor API usage and costs  
✅ **Rate Limiting** - Prevent API abuse  
✅ **Error Handling** - Graceful failure recovery  

## Quick Start

### 1. Prerequisites
- Node.js 16+
- OpenAI API key from https://platform.openai.com/api-keys

### 2. Setup

```bash
# Install dependencies
npm install

# Create .env file
cat > .env << EOF
OPENAI_API_KEY=sk-...
HTTP_PORT=6301
FRONTEND_URL=http://localhost:3000
EOF

# Start the server
npm run dev
```

### 3. Test the API

**Start a chat session:**
```bash
curl -X POST http://localhost:6301/api/chat/start
# Response: { "sessionId": "uuid-here" }
```

**Send a message:**
```bash
curl -X POST http://localhost:6301/api/chat/{sessionId}/message \
  -H "Content-Type: application/json" \
  -d '{"message": "What is Node.js?"}'
```

**Generate an image:**
```bash
curl -X POST http://localhost:6301/api/images/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "A beautiful sunset over mountains"}'
```

## API Endpoints

### Chat Sessions

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/chat/start` | Start new session |
| POST | `/api/chat/:sessionId/message` | Send message |
| GET | `/api/chat/:sessionId/history` | Get conversation |
| DELETE | `/api/chat/:sessionId` | End session |
| GET | `/api/chat/sessions` | List all sessions |

### Completions

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/completions` | Get text completion |

### Images

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/images/generate` | Generate image |

## Request/Response Examples

### Chat Message
**Request:**
```json
{
  "message": "Explain quantum computing",
  "model": "gpt-3.5-turbo",
  "temperature": 0.7,
  "maxTokens": 500
}
```

**Response:**
```json
{
  "success": true,
  "message": "Quantum computing leverages quantum mechanics...",
  "usage": {
    "prompt_tokens": 5,
    "completion_tokens": 150,
    "total_tokens": 155
  },
  "model": "gpt-3.5-turbo",
  "sessionId": "session-uuid",
  "totalMessages": 2
}
```

### Image Generation
**Request:**
```json
{
  "prompt": "A cat in astronaut suit floating in space",
  "size": "512x512",
  "quality": "standard",
  "n": 1
}
```

**Response:**
```json
{
  "success": true,
  "images": [
    {
      "url": "https://...",
      "revisedPrompt": "A cat in an astronaut suit floating in space..."
    }
  ],
  "created": 1234567890
}
```

## Environment Variables

```env
OPENAI_API_KEY          # Your OpenAI API key (required)
HTTP_PORT              # Server port (default: 6301)
FRONTEND_URL           # Frontend origin for CORS (default: http://localhost:3000)
NODE_ENV               # Development/production mode
```

## Configuration

### Model Selection

**For most tasks:** `gpt-3.5-turbo` (fastest, cheapest)  
**For complex tasks:** `gpt-4` (smarter, slower, expensive)  
**For very complex tasks:** `gpt-4-turbo` (good balance)  

### Temperature Settings

- **0.0-0.3:** Deterministic, factual (ideal for Q&A)
- **0.7:** Balanced (ideal for conversations)
- **1.0-2.0:** Creative, random (ideal for brainstorming)

### Cost Estimation

```javascript
// GPT-3.5-turbo: 150 tokens
// Input: $0.0005/1K tokens = $0.000075
// Output: $0.0015/1K tokens = $0.000225
// Total: ~$0.0003 per message
```

## Security Considerations

### ✅ Best Practices
- Store API key in environment variables
- Validate input length and format
- Implement rate limiting per user
- Log API usage for cost tracking
- Use system prompts to define AI behavior
- Implement content moderation

### ⚠️ Common Pitfalls
- ❌ Exposing API key in frontend code
- ❌ Unlimited token generation
- ❌ No rate limiting (cost explosion)
- ❌ Processing user input without validation
- ❌ Exposing conversation history to wrong users

## Troubleshooting

### "401 Unauthorized"
- Check that OPENAI_API_KEY is set correctly
- Verify key is active in OpenAI dashboard
- Ensure key is not revoked or expired

### "429 Too Many Requests"
- You've exceeded OpenAI's rate limits
- Implement exponential backoff for retries
- Check your billing status

### "No session found"
- Session IDs are stored in-memory only
- Sessions are lost on server restart
- For persistence, implement database storage

### Image generation returns "403 Forbidden"
- DALL-E 3 may not be available in your region
- Verify you have API access in your account
- Check billing is active

## Performance Tips

1. **Reuse Models:** Don't switch models frequently
2. **Cache Responses:** Store common completions
3. **Batch Requests:** Send multiple requests together
4. **Summarize Conversations:** Reduce token count for old conversations
5. **Monitor Costs:** Set up billing alerts in OpenAI console

## Database Integration

For production, store sessions in a database:

```javascript
// Example: MongoDB
const sessionSchema = {
  _id: ObjectId,
  sessionId: String,
  userId: String,
  messages: Array,
  createdAt: Date,
  updatedAt: Date,
  totalTokens: Number,
  estimatedCost: Number
};
```

## Next Steps

1. ✅ Test all endpoints with curl/Postman
2. ✅ Implement user authentication
3. ✅ Add database persistence
4. ✅ Set up cost monitoring
5. ✅ Implement conversation summarization
6. ✅ Add prompt templates
7. ✅ Create rate limiting per user tier

## Resources

- [OpenAI API Guide](https://platform.openai.com/docs/api-reference)
- [Chat Completions](https://platform.openai.com/docs/guides/gpt)
- [Image Generation](https://platform.openai.com/docs/guides/images)
- [Token Counting](https://platform.openai.com/docs/guides/tokens)
- [Best Practices](https://platform.openai.com/docs/guides/safety-best-practices)

