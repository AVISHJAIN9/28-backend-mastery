const Joi = require('joi');\n\nconst recordSchema = Joi.object({\n  title: Joi.string().required(),\n  content: Joi.string().required()\n});\n\nmodule.exports = { recordSchema };"
