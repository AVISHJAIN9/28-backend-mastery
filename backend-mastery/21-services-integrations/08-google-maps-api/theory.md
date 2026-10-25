# Location Services & Mapping APIs: Theory & Concepts

## 1. Geocoding Fundamentals

### Address to Coordinates
```
Input: "1600 Pennsylvania Ave, Washington DC"
↓
Google Geocoding API processes
↓
Output: { lat: 38.8951, lon: -77.0369 }
```

### Accuracy Levels
- **Rooftop accuracy**: Exact address (house number) ± 1 meter
- **Range accuracy**: Street segment (odd/even) ± 5 meters
- **Street level**: Street name only ± 50 meters
- **City level**: City level ± 1 km

**Use case**: E-commerce uses rooftop for shipping address validation.
**Issue**: Incomplete address → lowest accuracy → Show user, ask confirmation

### Reverse Geocoding
```
Input: 40.7128, -74.0060 (New York City coordinates)
↓
Google Reverse Geocoding API
↓
Output: "350 5th Ave, New York, NY 10118"
```

## 2. Routes & Directions

### Haversine Formula
Calculates distance between two coordinates:
```
Distance = 2 * R * arcsin(sqrt(sin²((lat2-lat1)/2) + cos(lat1)*cos(lat2)*sin²((lon2-lon1)/2)))
R = Earth radius (6371 km)
```

Result: Straight-line distance ("as crow flies")

**Limitation**: Doesn't account for roads, obstacles.

### Driving vs Walking Routes
```
Car route: 5 km, 10 minutes (highways, 60 mph)
Walking: 5 km, 1 hour (sidewalks, 5 mph)
Bike: 5 km, 15 minutes (bike lanes, 20 mph)
```

Google Directions API returns mode-specific routes.

## 3. Geofencing

### Boundary Checking
```
User location: 40.7128, -74.0060
Geofence: Circle centered at 40.7050, -74.0100 with 1 km radius

Distance from center: 0.85 km
↓
Distance < radius (0.85 < 1.0) = INSIDE
↓
Trigger action: "Welcome to Store #123"
```

### Polygon Geofences
Complex boundaries (store with multiple buildings):
```
Point-in-polygon test: Is latitude/longitude inside polygon?

User: 40.7128, -74.0060
Polygon: [(40.7, -74.01), (40.72, -74.01), (40.72, -74.00), (40.7, -74.00)]
↓
Ray casting algorithm ↓
Result: INSIDE = true
```

### Update Frequency
```
Desired: Real-time geofence detection
Reality: GPS updates every 1-10 seconds
  ↓
User walks 5 meters per second (18 km/h jog)
  ↓
With 5-second GPS update: Misses 25-meter jog before next location refresh
  ↓
Geofence boundary: 100 meters
User could cross entire boundary between GPS updates
  ↓
Solution: Keep geofence larger (buffer = 2x expected max distance)
```

## 4. API Rate Limits & Caching

### Quota Planning
```
Google Maps API quota:
- Free tier: 25,000 requests/day (Geocoding)
- Cost: $0.50 per 1,000 requests after free tier

SaaS usage:
- 100 users * 10 requests/day = 1,000/day (free tier OK)
- 10,000 users * 10 requests/day = 100,000/day ($40/day)
```

### Caching Strategy
Geocode address once, cache forever:
```
Address doesn't move, so cache result indefinitely
Example:
- First request: "123 Main St" → Google API (costs $) → Store result
- Second request: "123 Main St" → Cache lookup (free) → Instant response

99% of addresses repeat (common streets, cities)
Caching reduces API calls by 99%
```

### Cache Invalidation
```
When to delete cached geocoding:
- Never (address doesn't change)

When to refresh directions:
- Every hour (traffic patterns change)
- On user request ("refresh", "find new route")
```

## 5. Privacy Concerns

### Location Data Sensitivity
Location reveals:
- Home address (multiple work-to-home trips)
- Religious affiliation (prayer times, synagogues, etc.)
- Political beliefs (rally attendance)
- Health conditions (hospital visits, rehab centers)
- Relationship status (dating app venue visits)
  
**Regulation**: 
- GDPR: Location data is personal data, needs consent
- CCPA: Location data must be "reasonably expectation" of collection
- State laws: Different rules per state

### Anonymization Limits
Location data difficult to anonymize:
- Even anonymized location trails can re-identify users
- De-identified dataset of 1M locations: Can re-identify many individuals

**Best practice**: Delete location data after use (not indefinite storage).

## 6. Security Checklist

- [ ] API Key server-side only (never in frontend)
- [ ] Key restricted to backend IP address
- [ ] Rate limiting on directions API (max 10/user/hour)
- [ ] Caching geocoding results (30+ day TTL)
- [ ] Directions cache only 1 hour (traffic changes)
- [ ] Geofence buffer adds safety margin
- [ ] Location data deleted after 30 days
- [ ] User consent captured before tracking
- [ ] Audit trail of location access
- [ ] Map tiles served over HTTPS
- [ ] API error messages generic (don't leak coordinates)
- [ ] Billing alerts if quota exceeded unexpectedly
