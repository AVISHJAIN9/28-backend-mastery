const express = require('express');
const router = express.Router();
const ctrl = require('./controller');
const { validateRequest } = require('./middleware');
const { geocodeSchema, reverseGeocodeSchema, directionsSchema, distanceMatrixSchema, placesSchema } = require('./schema');

router.post('/geocode', validateRequest(geocodeSchema), ctrl.geocode);
router.post('/reverse-geocode', validateRequest(reverseGeocodeSchema), ctrl.reverseGeocode);
router.post('/directions', validateRequest(directionsSchema), ctrl.directions);
router.post('/distance-matrix', validateRequest(distanceMatrixSchema), ctrl.distanceMatrix);
router.post('/places/search', validateRequest(placesSchema), ctrl.textSearch);

module.exports = router;
