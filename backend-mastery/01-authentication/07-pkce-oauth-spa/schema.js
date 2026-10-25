const Joi = require('joi');

// Authorization endpoint - client requests auth code with PKCE challenge
exports.authorizeSchema = Joi.object({
  code_challenge: Joi.string().required(),
  redirect_uri: Joi.string().uri().required()
});

// Token endpoint - client exchanges code + verifier for access token
exports.authSchema = Joi.object({
  code: Joi.string().required(),
  code_verifier: Joi.string().required(),
  redirect_uri: Joi.string().uri().required()
});
