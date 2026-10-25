# Setup - Virus Scanning with ClamAV

## Prerequisites

- Node.js 18+
- ClamAV installed
- 1GB disk for virus DB

## Installation

### 1. Install ClamAV

**macOS:**
```bash
brew install clamav
```

**Linux (Ubuntu):**
```bash
sudo apt install clamav clamav-daemon
```

### 2. Update Virus Database
```bash
freshclam
```

Downloads latest signatures (~100MB)

### 3. Start ClamAV Daemon
```bash
clamd
```

### 4. Install Node Dependencies
```bash
cd 09-virus-scanning-clamav
npm install
```

### 5. Configure Environment
```bash
cp .env.example .env
# Update CLAMAD_HOST and CLAMAD_PORT if needed
```

### 6. Start Server
```bash
npm start
```

Server runs on http://localhost:6609

## Testing

### Upload Clean File
```bash
curl -X POST http://localhost:6609/api/scan \\
  -F "file=@clean_file.txt"
```

### Health Check
```bash
curl http://localhost:6609/api/health
```

## Troubleshooting

### ClamAV Changes
```bash
freshclam --update-db=daily
```

### Daemon Won't Start
```bash
clamd --version
sudo systemctl start clamav-daemon
```

### Connection Refused
```bash
Verify CLAMAD_HOST and CLAMAD_PORT
Check if clamd is running
```

## Next Steps

1. Configure quarantine directory
2. Test with various files
3. [Module 10 - EXIF Metadata](../10-exif-metadata-strip/)
