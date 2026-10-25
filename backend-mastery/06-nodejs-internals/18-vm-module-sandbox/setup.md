# Setup Guide: VM Module & Sandbox

## Prerequisites
- Node.js 14.0+
- npm or yarn
- Basic understanding of JavaScript contexts

## Installation Steps

### 1. Install Dependencies
```bash
cd 18-vm-module-sandbox
npm install
```

**Key packages:**
- `express` - Web server
- `joi` - Schema validation
- `vm` - Built-in Node module

### 2. Environment Setup
Create `.env` file:
```env
HTTP_PORT=3018
NODE_ENV=development
LOG_LEVEL=debug
```

### 3. Start Server
```bash
npm start
```

Expected output:
```
🚀 Server listening on http://localhost:3018
```

### 4. Verify Installation
```bash
curl http://localhost:3018/api/vm/sandbox-info
```

Expected response:
```json
{ "sandboxes": [] }
```

### 5. Open Frontend
Navigate to: `http://localhost:3018`
- You should see interactive sandbox UI
- Test buttons for each operation
- History of executions

## Troubleshooting

| Error | Solution |
|-------|----------|
| EADDRINUSE 3018 | Change port in `.env` or kill existing process |
| Missing module | Run `npm install` again |
| CORS error | Ensure frontend URL matches in server |
| Sandbox timeout | Increase VM timeout or check infinite loops |

## Development Tips

### Restart on Changes
```bash
npm install -g nodemon
nodemon server.js
```

### Debug Mode
```bash
node --inspect server.js
# Then open chrome://inspect
```

### Test Sandbox Execution
```bash
curl -X POST http://localhost:3018/api/vm/execute \
  -H "Content-Type: application/json" \
  -d '{"code":"1+1","vars":{}}'
```

## File Structure
```
18-vm-module-sandbox/
├── server.js           # Express setup
├── routes.js           # Route definitions
├── controller.js       # Business logic
├── middleware.js       # Auth & validation
├── schema.js           # JOI schemas
├── App.jsx            # React UI
├── package.json       # Dependencies
├── .env.example       # Env template
└── theory.md          # Concepts
```

## Next Steps
1. Read `theory.md` for deep concepts
2. Examine `routes.js` for available endpoints
3. Test endpoints via frontend UI
4. Study `controller.js` for implementation patterns
5. Modify `schema.js` to add new validations

## Performance Baselines
- New context creation: ~1-5ms
- Script execution: <1ms typical
- String output: variable based on code
- Memory per context: ~100KB baseline

## Security Notes
- Sandboxes prevent `require()` access ✅
- Sandboxes prevent `process` access ✅
- Sandboxes still allow infinite loops
- Not suitable for untrusted C++ code
- Use Resource limits for production
