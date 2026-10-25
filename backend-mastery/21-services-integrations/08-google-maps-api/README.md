# Google Maps API Integration

## What is this?

Google Maps API enables location-based features:
- **Geocoding**: Convert addresses to coordinates and vice versa
- **Directions API**: Calculate routes, distances, estimated travel time
- **Maps Static API**: Embed map images in emails, documents
- **Place Search**: Find businesses, restaurants, landmarks nearby
- **Distance Matrix**: Calculate distance between multiple origin/destination pairs
- **Geofencing**: Trigger actions when user enters/exits geographic boundary

## Why does it matter?

Location services are critical for delivery apps, real estate platforms, and local search. Google Maps API is industry standard with 99.9% uptime SLA and handles billions of requests daily. Integrated authentication prevents API key exposure in browser.

## How it works (step by step)

1. **Request Location Data**: Client sends address or coordinates to backend
2. **Geocode Address**: Backend calls Google Geocoding API, caches result
3. **Calculate Direction**: GET `/api/maps/directions` with origin/destination
4. **Get Distance Matrix**: Calculate distances between 25 origins and destinations
5. **Find Nearby Places**: Search radius 1000m for restaurants, hotels, hospitals
6. **Generate Static Map**: Embed map image with markers in email/document
7. **Geofence Check**: Compare user location to boundaries, trigger webhook

## Key concepts

- **API Key Security**: Store key server-side only, restrict to backend IP
- **Rate Limiting**: Google charges per request; implement local caching
- **Distance Units**: API returns meters; convert to miles/km as needed
- **Geocoding Accuracy**: Accuracy varies by country; validate results
- **Caching Layer**: Cache geocoding results for 30 days (addresses don't move)
- **Fallback Maps**: Use OpenStreetMap if Google quota exceeded
- **Geofencing Latency**: Update every 1-5 minutes, not per coordinate change

## Common mistakes

1. **API key exposed in frontend** → Attackers embed, burn quota → Server-side signing only
2. **No rate limiting** → Single request costs money, DoS exhausts quota → Implement request throttling
3. **No caching** → Same address geocoded 100x = 100x cost → Cache for 30 days
4. **Using wrong distance units** → Route shows 10 miles instead of 10km → Check context
5. **Calling API on page load** → Slow page load, high quota burn → Lazy load, user-triggered
6. **Geofencing fires too often** → Battery drain, high latency requirement → Update every 5 minutes

## Real world usage

**Delivery App**: Customer enters address → geocoded to coordinates → finds nearest driver → directions calculated → ETA shown on map
**Real Estate**: Agent creates property listings → embedded map shows location → nearby schools/transit displayed
**Field Service**: Technician arrives on job → location checked against coordinates → check-in recorded
**E-commerce**: User enters zip code → geocoded to lat/lon → nearby stores found → in-store pickup offered

## API Endpoints

### Geocoding
- `POST /api/maps/geocode` - Convert address to coordinates
- `POST /api/maps/reverse-geocode` - Convert coordinates to address

### Routing
- `GET /api/maps/directions` - Calculate route and distance
- `POST /api/maps/distance-matrix` - Calculate distance between multiple points

### Places
- `GET /api/maps/nearby` - Find places within radius
- `GET /api/maps/place/:id` - Get place details

### Maps
- `GET /api/maps/static` - Get static map image
- `POST /api/maps/geofence` - Check if location inside boundary

## Quick Start

```bash
npm install
node server.js
# Running on http://localhost:6308
```

## Testing

```bash
# Geocode address
curl -X POST http://localhost:6308/api/maps/geocode \
  -H "Content-Type: application/json" \
  -d '{"address":"1600 Pennsylvania Ave NW, Washington, DC"}'

# Get directions
curl "http://localhost:6308/api/maps/directions?origin=40.7,-74&destination=34.05,-118.24"

# Find nearby places
curl "http://localhost:6308/api/maps/nearby?lat=40.7&lon=-74&type=restaurant&radius=1000"

# Check geofence
curl -X POST http://localhost:6308/api/maps/geofence \
  -H "Content-Type: application/json" \
  -d '{"lat":40.7,"lon":-74,"boundaryId":"store-123"}'
```
