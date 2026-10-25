const Joi = require('joi');

const transcribeSchema = Joi.object({
  audioUrl: Joi.string().uri().required(),
  language: Joi.string().default('en-US'),
});

const synthesizeSpeechSchema = Joi.object({
  text: Joi.string().required(),
  language: Joi.string().default('en-US'),
  voice: Joi.string().valid('male', 'female').default('female'),
  audioFormat: Joi.string().valid('mp3', 'wav', 'ogg').default('mp3'),
});

const listVoicesSchema = Joi.object({
  language: Joi.string(),
});

module.exports = {
  transcribeSchema,
  synthesizeSpeechSchema,
  listVoicesSchema,
};
