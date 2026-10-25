const Joi = require('joi');\n\nconst userSchema = Joi.object({\n  name: Joi.string().required(),\n  email: Joi.string().email().required()\n});\n\nmodule.exports = { userSchema };"
