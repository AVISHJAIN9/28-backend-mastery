const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { validateOpenAIApiKey, rateLimitLogger, openaiErrorHandler } = require('./middleware');
const { messageSchema, completionRequestSchema, imageGenerationSchema } = require('./schema');
const { validateRequest } = require('./middleware');

// ==================== Middleware ====================
router.use(validateOpenAIApiKey);
router.use(rateLimitLogger);

// ==================== Chat Sessions ====================

/**
 * POST /api/chat/start - Start a new chat session
 */
router.post('/chat/start', controller.startChatSession);

/**
 * POST /api/chat/:sessionId/message - Send message in session
 */
router.post('/chat/:sessionId/message', validateRequest(messageSchema), controller.sendChatMessage);

/**
 * GET /api/chat/:sessionId/history - Get conversation history
 */
router.get('/chat/:sessionId/history', controller.getConversationHistory);

/**
 * DELETE /api/chat/:sessionId - End chat session
 */
router.delete('/chat/:sessionId', controller.endSession);

/**
 * GET /api/chat/sessions - List all sessions
 */
router.get('/chat/sessions', controller.listSessions);

// ==================== Completions ====================

/**
 * POST /api/completions - Get text completion
 */
router.post('/completions', validateRequest(completionRequestSchema), controller.getCompletion);

// ==================== Image Generation ====================

/**
 * POST /api/images/generate - Generate image with DALL-E
 */
router.post('/images/generate', validateRequest(imageGenerationSchema), controller.generateImage);

// ==================== Error Handler ====================
router.use(openaiErrorHandler);

module.exports = router;
