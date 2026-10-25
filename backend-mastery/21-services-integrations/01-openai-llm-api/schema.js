const Joi = require('joi');

// ==================== Message Schema ====================
const messageSchema = Joi.object({
  message: Joi.string().max(2000).required(),
  model: Joi.string().valid('gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo').default('gpt-3.5-turbo'),
  temperature: Joi.number().min(0).max(2).default(0.7),
  maxTokens: Joi.number().min(1).max(4000).default(500),
});

// ==================== Chat History Schema ====================
const chatHistorySchema = Joi.object({
  userId: Joi.string().required(),
  messages: Joi.array().items({
    role: Joi.string().valid('user', 'assistant').required(),
    content: Joi.string().required(),
    timestamp: Joi.date(),
  }).default([]),
  createdAt: Joi.date().default(() => new Date()),
  updatedAt: Joi.date().default(() => new Date()),
});

// ==================== Completion Request Schema ====================
const completionRequestSchema = Joi.object({
  prompt: Joi.string().max(2000).required(),
  model: Joi.string().valid('gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo').default('gpt-3.5-turbo'),
  temperature: Joi.number().min(0).max(2).default(0.7),
  maxTokens: Joi.number().min(1).max(4000).default(500),
  topP: Joi.number().min(0).max(1).default(1),
  frequencyPenalty: Joi.number().min(-2).max(2).default(0),
  presencePenalty: Joi.number().min(-2).max(2).default(0),
});

// ==================== Image Generation Schema ====================
const imageGenerationSchema = Joi.object({
  prompt: Joi.string().max(1000).required(),
  size: Joi.string().valid('256x256', '512x512', '1024x1024').default('512x512'),
  quality: Joi.string().valid('standard', 'hd').default('standard'),
  n: Joi.number().min(1).max(10).default(1),
});

module.exports = {
  messageSchema,
  chatHistorySchema,
  completionRequestSchema,
  imageGenerationSchema,
};
