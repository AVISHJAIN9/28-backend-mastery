import Joi from 'joi';

const requestTGTSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required(),
  password: Joi.string().min(6).required()
});

const requestServiceTicketSchema = Joi.object({
  sessionId: Joi.string().uuid().required(),
  serviceName: Joi.string().min(3).max(50).required()
});

const authenticateServiceSchema = Joi.object({
  ticketId: Joi.string().uuid().required(),
  serviceName: Joi.string().min(3).max(50).required()
});

const logoutSchema = Joi.object({
  sessionId: Joi.string().uuid().required()
});

export default {
  requestTGTSchema,
  requestServiceTicketSchema,
  authenticateServiceSchema,
  logoutSchema
};
