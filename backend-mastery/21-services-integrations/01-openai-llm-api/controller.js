const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

// ==================== State (In-memory) ====================
const chatSessions = new Map();
const conversationHistory = new Map();

// ==================== Controllers ====================

/**
 * Start a new chat session
 */
exports.startChatSession = (req, res) => {
  const sessionId = uuidv4();
  chatSessions.set(sessionId, {
    id: sessionId,
    createdAt: new Date(),
    updatedAt: new Date(),
    messageCount: 0,
  });
  conversationHistory.set(sessionId, []);

  res.json({
    success: true,
    sessionId,
    message: 'Chat session started',
  });
};

/**
 * Send message to OpenAI Chat Completion API
 */
exports.sendChatMessage = async (req, res) => {
  const { sessionId } = req.params;
  const { message, model = 'gpt-3.5-turbo', temperature = 0.7, maxTokens = 500 } = req.validatedBody;

  // Verify session exists
  const session = chatSessions.get(sessionId);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  try {
    // Get conversation history
    const history = conversationHistory.get(sessionId) || [];
    
    // Build messages array
    const messages = [
      ...history,
      { role: 'user', content: message },
    ];

    // Call OpenAI API
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const assistantMessage = response.data.choices[0].message.content;

    // Store in conversation history
    history.push({ role: 'user', content: message });
    history.push({ role: 'assistant', content: assistantMessage });
    conversationHistory.set(sessionId, history);

    // Update session
    session.messageCount += 1;
    session.updatedAt = new Date();

    res.json({
      success: true,
      message: assistantMessage,
      usage: response.data.usage,
      model: response.data.model,
      sessionId,
      totalMessages: history.length,
    });
  } catch (error) {
    const status = error.response?.status || 500;
    const errorMessage = error.response?.data?.error?.message || error.message;
    res.status(status).json({ error: errorMessage });
  }
};

/**
 * Get completion for a text prompt
 */
exports.getCompletion = async (req, res) => {
  const { prompt, model = 'gpt-3.5-turbo', temperature = 0.7, maxTokens = 500 } = req.validatedBody;

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature,
        max_tokens: maxTokens,
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    res.json({
      success: true,
      completion: response.data.choices[0].message.content,
      usage: response.data.usage,
      model: response.data.model,
    });
  } catch (error) {
    const status = error.response?.status || 500;
    const errorMessage = error.response?.data?.error?.message || error.message;
    res.status(status).json({ error: errorMessage });
  }
};

/**
 * Generate image using DALL-E API
 */
exports.generateImage = async (req, res) => {
  const { prompt, size = '512x512', quality = 'standard', n = 1 } = req.validatedBody;

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/images/generations',
      {
        prompt,
        size,
        quality,
        n,
        model: 'dall-e-3',
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    res.json({
      success: true,
      images: response.data.data.map(img => ({
        url: img.url,
        revisedPrompt: img.revised_prompt,
      })),
      created: response.data.created,
    });
  } catch (error) {
    const status = error.response?.status || 500;
    const errorMessage = error.response?.data?.error?.message || error.message;
    res.status(status).json({ error: errorMessage });
  }
};

/**
 * Get conversation history
 */
exports.getConversationHistory = (req, res) => {
  const { sessionId } = req.params;

  const session = chatSessions.get(sessionId);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  const history = conversationHistory.get(sessionId) || [];

  res.json({
    success: true,
    sessionId,
    messageCount: history.length,
    messages: history,
    session,
  });
};

/**
 * List all active sessions
 */
exports.listSessions = (req, res) => {
  const sessions = Array.from(chatSessions.values());

  res.json({
    success: true,
    totalSessions: sessions.length,
    sessions: sessions.map(s => ({
      ...s,
      historyLength: conversationHistory.get(s.id)?.length || 0,
    })),
  });
};

/**
 * End chat session
 */
exports.endSession = (req, res) => {
  const { sessionId } = req.params;

  if (!chatSessions.has(sessionId)) {
    return res.status(404).json({ error: 'Session not found' });
  }

  const history = conversationHistory.get(sessionId);
  chatSessions.delete(sessionId);
  conversationHistory.delete(sessionId);

  res.json({
    success: true,
    message: 'Session ended',
    sessionId,
    conversationLength: history?.length || 0,
  });
};

module.exports = {
  startChatSession,
  sendChatMessage,
  getCompletion,
  generateImage,
  getConversationHistory,
  listSessions,
  endSession,
};
