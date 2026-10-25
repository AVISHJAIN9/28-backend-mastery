# Setup & Installation Guide

## Prerequisites

- Node.js 18+ 
- npm or yarn
- A text editor (VS Code recommended)

## Installation

### Step 1: Install Dependencies

```bash
npm install
```

This installs:
- **express** - Web framework
- **winston** - Structured logging
- **uuid** - Correlation ID generation
- **helmet** - Security headers
- **cors** - Cross-origin requests
- **dotenv** - Environment variables

### Step 2: Environment Configuration

Create `.env` from template:

```bash
cp .env.example .env
```

Customize if needed:

```env
LOG_LEVEL=info          # debug, info, warn, error
LOG_DIR=./logs          # Where log files go
LOG_FILE_SIZE=5242880   # 5MB max per file
HTTP_PORT=4001
```

### Step 3: Create Logs Directory

```bash
mkdir -p logs
```

The server creates this automatically if missing.

## Running the Server

### Development Mode (with auto-reload)

```bash
npm run dev
```

### Production Mode

```bash
npm start
```

### Expected Output

```
╔════════════════════════════════════════════╗
║     Structured Logging Server Running     ║
║          Port: 4001                       ║
║     http://localhost:4001                 ║
╚════════════════════════════════════════════╝
```

## Testing the Installation

### 1. Check Server is Running

```bash
curl http://localhost:4001
```

Should return:

```json
{
  "message": "Structured Logging & Observability Server",
  "endpoints": {
    "get_logs": "GET /api/logs",
    "filter_logs": "GET /api/logs/filter",
    "logger_info": "GET /api/logger/info",
    "user": "GET /api/users/:id",
    "checkout": "POST /api/checkout"
  }
}
```

### 2. View Logs

```bash
curl http://localhost:4001/api/logs | head -20
```

### 3. Create a Log Entry

```bash
curl -X POST http://localhost:4001/api/logs/create \
  -H "Content-Type: application/json" \
  -d '{
    "event": "test_event",
    "level": "info",
    "data": { "test": true }
  }'
```

### 4. Check Log Files

```bash
ls -la logs/
cat logs/combined.log | tail -5
```

## Stopping the Server

```bash
# Kill the process
Ctrl + C

# Or find and kill by port
lsof -ti:4001 | xargs kill -9
```

## Troubleshooting

### Issue: Port 4001 Already in Use

**Error:** `EADDRINUSE: address already in use :::4001`

**Solution 1** - Change port in `.env`:
```env
HTTP_PORT=4002
```

**Solution 2** - Kill process using port:
```bash
# macOS/Linux
lsof -ti:4001 | xargs kill -9

# Windows
netstat -ano | findstr :4001
taskkill /PID <PID> /F
```

### Issue: Permission Denied Creating Logs Directory

**Error:** `EACCES: permission denied, mkdir './logs'`

**Solution:**
```bash
sudo chmod -R 755 .
mkdir -p logs
chmod 755 logs
```

### Issue: Module Not Found

**Error:** `Cannot find module 'express'`

**Solution:**
```bash
rm -rf node_modules package-lock.json
npm install
```

### Issue: Logs Not Being Created

**Possible Causes:**
1. Logs directory doesn't exist
2. Disk full or permission issues
3. LOG_LEVEL set too high

**Check:**
```bash
# Verify directory exists
ls -la logs/

# Check permissions
chmod 755 logs/

# Check disk space
df -h

# View logger info
curl http://localhost:4001/api/logger/info
```

### Issue: Correlation IDs Not Appearing

**Check Request Headers:**
```bash
curl -i http://localhost:4001/api/logs \
  -H "X-Correlation-ID: test-123"
```

**Response should include:**
```
X-Correlation-ID: test-123
```

## Viewing Logs

### Real-time Tail

```bash
tail -f logs/combined.log
```

### Parse JSON Logs

```bash
tail -f logs/combined.log | \
  jq 'select(.level=="error")'
```

### Search by Event

```bash
grep "checkout_started" logs/combined.log
```

### Count Events

```bash
jq -s 'group_by(.event) | map({event: .[0].event, count: length})' logs/combined.log
```

## Configuration Details

### Log Levels

```
5 = error   (only errors)
4 = warn    (errors + warnings)
3 = info    (errors + warnings + info)
2 = http    (all above + HTTP requests)
1 = debug   (everything - verbose)
0 = silly   (most verbose)
```

### Log Transports

- **File (error.log)** - Only ERROR level
- **File (combined.log)** - All levels
- **Console** - INFO and above (development)

### Correlation ID Propagation

The middleware creates a correlation ID if not provided:

```javascript
X-Correlation-ID: req_82f4c9a1_6e9d_4a15_8c2b_3f1e9a7c5d42
```

This ID appears in:
- Response headers
- All log entries
- Child loggers
- Error messages

## Environment Variables Reference

| Variable | Default | Purpose |
|----------|---------|---------|
| `LOG_LEVEL` | `info` | Minimum log level |
| `LOG_DIR` | `./logs` | Log file directory |
| `LOG_FILE_SIZE` | `5242880` | Max file size before rotation |
| `HTTP_PORT` | `4001` | Server port |
| `NODE_ENV` | `development` | Environment |

## Development vs Production

### Development
```bash
npm run dev
```
- Auto-restart on file changes
- Console logging for debugging
- Verbose error messages

### Production
```bash
npm start
```
- No auto-restart
- File-only logging (faster)
- Error details removed
- Log rotation enabled

## Next Steps

1. ✅ Installation complete
2. Read README.md for API documentation
3. Review theory.md for concepts
4. Test all endpoints with React UI
5. Move to Module 02 (Log Levels)

## Support

- Check error.log for stack traces
- Review theory.md for concepts
- Test with curl examples in README.md
- Compare with similar Modules 02-09
