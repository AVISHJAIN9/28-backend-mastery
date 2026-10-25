# Theory - EXIF Metadata & Privacy

## What is EXIF?

### Definition
- Exchangeable Image File Format
- Standard for storing metadata
- Embedded in image file
- Not visible in preview

### Components
```
Image File
  ↓
Image Data (pixels)
ExifMetadata (hidden)
  - Camera info
  - GPS coordinates
  - Date/time
  - Copyright
```

## Common EXIF Fields

### Camera Information
- Make: Canon, Nikon, Sony, etc.
- Model: Canon EOS 5D Mark IV
- Lens: 24-70mm f/2.8
- Serial numbers (fingerprinting)

### Image Properties
- Resolution: 3840×2560
- Color space: sRGB, Adobe RGB
- Orientation: 0°, 90°, etc.
- Compression: JPEG quality

### Exposure Settings
- ISO: 100-6400
- Shutter speed: 1/1000
- Aperture: f/2.8
- Focal length: 50mm
- Flash: On/Off

### Location Data
- GPS latitude/longitude
- Altitude
- Direction
- Accuracy

### Temporal Data
- Date taken: 2024-01-15
- Time: 14:30:45
- Timezone: UTC-5
- Modified date

## Privacy Risks

### Location Exposure
```
Take photo at home
  ↓
Share on social media
  ↓
Attacker reads GPS
  ↓
Burglar visits address
```

### Device Fingerprinting
```
Photo 1: Camera XYZ
Photo 2: Camera XYZ
Photo 3: Camera XYZ
  ↓
All from same device
  ↓
Track user across platforms
```

### Timeline Analysis
```
Photo 1: Home (8am)
Photo 2: Office (9am)
Photo 3: Restaurant (12pm)
  ↓
Reveal daily routine
```

## EXIF Removal Tools

### Online Services
- Pros: Easy, no setup
- Cons: Privacy (uploads to server)

### Desktop Software
- Pros: Private, powerful
- Cons: Installation required

### Server-Side Processing
- Pros: Automatic, secure, scalable
- Cons: Processing overhead

## Implementation

### Using Sharp
```javascript
const cleaned = await sharp(buffer)
  .withMetadata(false)  // Remove EXIF
  .toBuffer();
```

### Verification
```javascript
const metadata = await sharp(buffer).metadata();
if (!metadata.exif) {
  console.log('EXIF removed successfully');
}
```

## Real-World Scenarios

### Social Media Upload
```
1. User uploads photo
2. System detects EXIF
3. Warn user (optional)
4. Remove metadata
5. Store cleaned version
6. No location leaks
```

### Privacy-Conscious Website
```
1. Accept user photos
2. Always strip EXIF
3. Store cleaned version
4. Show on website
5. Download privacy-safe
```

### Corporate Images
```
1. Marketing team uploads photos
2. Auto-remove serial numbers
3. Remove camera make/model
4. Standardize metadata
5. Consistent branding
```

## GDPR & Legal Compliance

### Personal Data
- GPS coordinates = Personal data
- Camera serial = Device identifier
- Device fingerprinting = Tracking
- All subject to GDPR

### Requirements
1. Disclose metadata collection
2. Offer removal option
3. Honor user choice
4. Document policy
5. Audit compliance

## Best Practices

1. **Default removal**: Strip by default
2. **Opt-in preservation**: Allow if user wants
3. **User notification**: Inform about risks
4. **Selective removal**: Keep only safe fields
5. **Verification**: Confirm removal worked
6. **Audit logging**: Track all operations
7. **Compliance**: Follow GDPR, CCPA, etc.

## Performance Impact

### Data Reduction
- EXIF data: 1-50KB typical
- Removal impact: <1% file size
- Processing time: <100ms
- Minimal overhead

## Summary

✅ EXIF contains sensitive location data
✅ GPS coordinates privacy risk
✅ Device fingerprinting threat
✅ Remove EXIF by default
✅ GDPR compliance required
✅ Sharp library easy removal
