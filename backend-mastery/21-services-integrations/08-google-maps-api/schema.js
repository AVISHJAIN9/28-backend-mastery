const Joi = require('joi');

const geocodeSchema = Joi.object({
  address: Joi.string().required(),
});

const reverseGeocodeSchema = Joi.object({
  latitude: Joi.number().min(-90).max(90).required(),
  longitude: Joi.number().min(-180).max(180).required(),
});

const directionsSchema = Joi.object({
  origin: Joi.string().required(),
  destination: Joi.string().required(),
  mode: Joi.string().valid('driving', 'walking', 'bicycling', 'transit').default('driving'),
});

const distanceMatrixSchema = Joi.object({
  origins: Joi.array().items(Joi.string()).required(),
  destinations: Joi.array().items(Joi.string()).required(),
});

const placesSchema = Joi.object({
  query: Joi.string().required(),
  location: Joi.object({ latitude: Joi.number(), longitude: Joi.number() }),
  radius: Joi.number().default(1000),
});

module.exports = {
  geocodeSchema,
  reverseGeocodeSchema,
  directionsSchema,
  distanceMatrixSchema,
  placesSchema,
};
