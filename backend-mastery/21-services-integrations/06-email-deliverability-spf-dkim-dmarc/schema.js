const Joi = require('joi');

const domainSchema = Joi.object({
  domain: Joi.string().domain().required(),
});

const spfSchema = Joi.object({
  domain: Joi.string().domain().required(),
  spfRecord: Joi.string().required(),
});

const dkimSchema = Joi.object({
  domain: Joi.string().domain().required(),
  selector: Joi.string().required(),
  publicKey: Joi.string().required(),
});

const dmarcSchema = Joi.object({
  domain: Joi.string().domain().required(),
  policy: Joi.string().valid('none', 'quarantine', 'reject'),
  rua: Joi.string().email(),
});

const dnsCheckSchema = Joi.object({
  domain: Joi.string().domain().required(),
  recordType: Joi.string().valid('SPF', 'DKIM', 'DMARC'),
});

module.exports = {
  domainSchema,
  spfSchema,
  dkimSchema,
  dmarcSchema,
  dnsCheckSchema,
};
