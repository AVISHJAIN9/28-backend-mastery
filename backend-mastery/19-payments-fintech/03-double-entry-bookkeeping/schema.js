const Joi = require('joi');

exports.journalEntrySchema = Joi.object({
  description: Joi.string().required(),
  entries: Joi.array().items(
    Joi.object({
      account: Joi.string().required(),
      debit: Joi.number().min(0),
      credit: Joi.number().min(0)
    })
  ).min(2).required()
});

exports.validateJournalEntry = (data) => {
  return exports.journalEntrySchema.validate(data, { abortEarly: false });
};

module.exports = exports;
