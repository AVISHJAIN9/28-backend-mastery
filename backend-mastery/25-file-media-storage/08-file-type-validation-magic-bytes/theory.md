# Theory - File Type Validation

## File Structure Basics

### File Components
- **Magic bytes (header)**: First few bytes identifying type
- **Metadata**: File info sections
- **Body**: Actual content
- **Footer**: End markers

### Magic Bytes (File Signatures)
```
Format  Hex          ASCII
JPEG    FF D8 FF    ...  
PNG     89 50 4E 47 .PNG
GIF     47 49 46    GIF
PDF     25 50 44 46 %PDF
ZIP     50 4B 03 04 PK..
```

## Why Validation Matters

### Security Risks
1. **Extension spoofing**: Rename .exe to .jpg
2. **File injection**: Upload disguised malware
3. **Buffer overflows**: Specially crafted files
4. **Path traversal**: Exploit file paths

### Prevention Strategy
```
User uploads: malicious.exe
1. Check extension: "exe" ❌ Blocked
2. Check magic bytes: Not image ❌ Blocked
3. If both pass: Safe to process ✅ Accept
```

## Common File Signatures

### Images
```
JPEG: FF D8 FF E0 ... (JFIF)
PNG:  89 50 4E 47 0D 0A 1A 0A
GIF:  47 49 46 38 (GIF8) or GIF9
BMP:  42 4D (BM)
TIFF: 49 49 2A 00 (little-endian) or 4D 4D 00 2A (big-endian)
WEBP: 52 49 46 46 ... 57 45 42 50 (RIFF...WEBP)
```

### Documents
```
PDF:  25 50 44 46 (%PDF)
DOCX: 50 4B 03 04 (ZIP - same as ZIP)
XLS:  D0 CF 11 E0 (OLE)
PPT:  D0 CF 11 E0 (OLE)
```

### Archives
```
ZIP:    50 4B 03 04 (PK..)
RAR:    52 61 72 21 (Rar!)
GZIP:   1F 8B (..)
TAR:    [No universal signature]
```

### Audio/Video
```
MP3:    FF FB or FF FA (MPEG)
WAV:    52 49 46 46 ... 57 41 56 45 (RIFF...WAVE)
MP4:    00 00 00 18/20 66 74 79 70 (ftyp)
MKV:    1A 45 DF A3 (E�£)
FLV:    46 4C 56 (FLV)
```

### Executables (DANGEROUS)
```
EXE:     4D 5A (MZ) - DOS/Windows executable
ELF:     7F 45 4C 46 (.ELF) - Linux/Unix
MAC:     FE ED FA ... (Mach-O binary)
SCRIPT:  23 21 (#!) - Shebang
```

## Validation Implementation

### Step 1: Read Magic Bytes
```javascript
const buffer = fs.readFileSync(filePath);
const magicBytes = buffer.slice(0, 8); // First 8 bytes
const hex = magicBytes.toString('hex');
```

### Step 2: Check Against Known Signatures
```javascript
const SIGNATURES = {
  jpeg: /^ffd8ff/,
  png: /^89504e47/,
  gif: /^474946/
};

for (const [type, regex] of Object.entries(SIGNATURES)) {
  if (regex.test(hex)) {
    return type; // Match found
  }
}
return 'unknown';
```

### Step 3: Combine with Extension Check
```javascript
const ext = path.extname(file).toLowerCase();
const allowedExts = ['.jpg', '.png', '.gif'];
const allowedTypes = ['jpeg', 'png', 'gif'];

if (!allowedExts.includes(ext)) {
  throw new Error('Extension not allowed');
}
if (!allowedTypes.includes(detectedType)) {
  throw new Error('File type mismatch');
}
```

## Real-World Examples

### E-commerce: Avatar Upload
```
1. User uploads avatar
2. Check extension: .jpg, .png only
3. Check magic bytes: Must be image
4. Max size: 5MB
5. Scan with virus engine
6. Resize and optimize
7. Store in S3
```

### Document Management: PDF Upload
```
1. User uploads document
2. Check extension: .pdf only
3. Check magic bytes: Must start with %PDF
4. Max size: 50MB
5. Virus scan
6. Extract metadata
7. Text indexing
```

## Security Best Practices

1. **Whitelist only**: Never blacklist (blocks evolve)
2. **Server-side validation**: Never trust client
3. **Rename files**: Use UUIDs, not user names
4. **Separate storage**: Don't serve from web root
5. **Scan thoroughly**: Use antivirus engines
6. **Log everything**: Track uploads for audit

## Summary

✅ Magic bytes identify true file type
✅ Extensions easily spoofed
✅ Always validate server-side
✅ Combine extension + magic checks
✅ Whitelist, never blacklist
