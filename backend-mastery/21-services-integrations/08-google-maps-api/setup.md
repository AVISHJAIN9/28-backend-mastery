# Google Maps API Setup Guide

## Prerequisites

- Google Cloud account
- Billing enabled
- Node.js 18.x or higher

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Create Google Cloud Project

1. Go to Google Cloud Console
2. Create new project: "My Maps Backend"
3. Enable APIs:
   - Geocoding API
   - Maps JavaScript API
   - Directions API
   - Distance Matrix API
   - Places API
   - Static Maps API

## Step 3: Create API Key

1. Go to Credentials > Create Credentials > API Key
2. Restrict key to HTTP referrers (backend IP only)
3. Copy API Key

## Step 4: Setup Maps Platform

1. Maps > Get Started
2. Create billing account and enable
3. Set up maps platform project
4. Generate Maps API key

## Step 5: Create .env File

```bash
cp .env.example .env
```

```env
GOOGLE_MAPS_API_KEY=your-api-key
GOOGLE_MAPS_REQUEST_TIMEOUT=5000
CACHE_GEOCODING=true
HTTP_PORT=6308
```

## Step 6: Configure Rate Limiting

Update server.js:
```javascript
const mapsLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10 // 10 requests per minute
});
```

## Step 7: Setup Caching

Configure Redis or local cache:
```javascript
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 2592000 }); // 30 days
```

## Step 8: Run Development Server

```bash
node server.js
# Server runs on http://localhost:6308
```

## How to test

```bash
# Geocode address
curl -X POST http://localhost:6308/api/maps/geocode \
  -H "Content-Type: application/json" \
  -d '{"address":"1600 Pennsylvania Ave, Washington DC"}'

# Get directions
curl "http://localhost:6308/api/maps/directions?origin=40.7,-74&destination=34.05,-118.24"

# Find nearby places
curl "http://localhost:6308/api/maps/nearby?lat=40.7&lon=-74&type=restaurant"

# Check geofence
curl -X POST http://localhost:6308/api/maps/geofence \
  -H "Content-Type: application/json" \
  -d '{"lat":40.7,"lon":-74,"boundaryId":"store-1"}'
```

## Verification Checklist

- [ ] Google Cloud project created
- [ ] Required APIs enabled
- [ ] API key generated
- [ ] API key restricted to backend only
- [ ] Billing account setup
- [ ] .env configured
- [ ] Server starts without errors
- [ ] Geocoding requests work
- [ ] Direction requests return routes
- [ ] Nearby search finds places
- [ ] Caching working
- [ ] Rate limiting active
