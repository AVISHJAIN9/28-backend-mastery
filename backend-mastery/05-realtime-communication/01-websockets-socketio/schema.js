// WebSocket Schema - Joi validation for Socket.io events

const Joi = require('joi');

const messageSchema = Joi.object({
  content: Joi.string().required().max(5000).messages({
    'string.empty': 'Message content cannot be empty',
    'string.max': 'Message content cannot exceed 5000 characters'
  }),
  recipientId: Joi.string().required().messages({
    'string.empty': 'Recipient ID is required'
  }),
  timestamp: Joi.date().optional().default(() => new Date())
});

const roomSchema = Joi.object({
  name: Joi.string().required().min(3).max(50),
  description: Joi.string().optional().max(200),
  isPrivate: Joi.boolean().default(false),
  capacity: Joi.number().optional().min(2).max(1000).default(100)
});

const eventSchema = Joi.object({
  type: Joi.string().required().valid('message', 'join', 'leave', 'typing'),
  data: Joi.object().required()
});

const userPresenceSchema = Joi.object({
  userId: Joi.string().required(),
  username: Joi.string().required(),
  status: Joi.string().valid('online', 'away', 'offline').default('online'),
  socketId: Joi.string().required()
});

module.exports = {
  messageSchema,
  roomSchema,
  eventSchema,
  userPresenceSchema
};

