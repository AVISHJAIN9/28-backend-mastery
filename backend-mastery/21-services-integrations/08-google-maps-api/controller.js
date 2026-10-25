const { v4: uuidv4 } = require('uuid');

const geocodeCache = new Map();
const directionsCache = new Map();

exports.geocode = (req, res) => {
  const { address } = req.validatedBody;
  
  const result = {
    address,
    latitude: 40.7128 + Math.random(),
    longitude: -74.0060 + Math.random(),
    formattedAddress: address,
    country: 'United States',
  };
  
  geocodeCache.set(address, result);
  
  res.json({
    success: true,
    results: [result],
  });
};

exports.reverseGeocode = (req, res) => {
  const { latitude, longitude } = req.validatedBody;
  
  res.json({
    success: true,
    address: `${latitude}, ${longitude}`,
    results: [
      {
        address: `123 Main St, New York, NY`,
        latitude,
        longitude,
      },
    ],
  });
};

exports.directions = (req, res) => {
  const { origin, destination, mode } = req.validatedBody;
  
  const key = `${origin}-${destination}`;
  const route = {
    origin,
    destination,
    mode,
    distance: '5.3 km',
    duration: '15 mins',
    steps: 8,
  };
  
  directionsCache.set(key, route);
  
  res.json({
    success: true,
    routes: [route],
  });
};

exports.distanceMatrix = (req, res) => {
  const { origins, destinations } = req.validatedBody;
  
  const rows = origins.map(origin => ({
    elements: destinations.map(dest => ({
      distance: { text: '5 km', value: 5000 },
      duration: { text: '15 mins', value: 900 },
      status: 'OK',
    })),
  }));
  
  res.json({
    success: true,
    originAddresses: origins,
    destinationAddresses: destinations,
    rows,
  });
};

exports.textSearch = (req, res) => {
  const { query, location, radius } = req.validatedBody;
  
  const results = [
    {
      id: uuidv4(),
      name: query,
      address: '123 Main St',
      latitude: location?.latitude || 40.7128,
      longitude: location?.longitude || -74.0060,
      rating: 4.5,
      types: ['restaurant', 'food'],
    },
    {
      id: uuidv4(),
      name: `${query} #2`,
      address: '456 Oak Ave',
      latitude: location?.latitude || 40.7128,
      longitude: location?.longitude || -74.0060,
      rating: 4.2,
      types: ['restaurant', 'food'],
    },
  ];
  
  res.json({
    success: true,
    query,
    results,
    totalResults: results.length,
  });
};

module.exports = {
  geocode,
  reverseGeocode,
  directions,
  distanceMatrix,
  textSearch,
};
