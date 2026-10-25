# Setup Guide: Debugging & Inspector

## Prerequisites
- Node.js 14.0+
- Chrome/Chromium browser

## Installation

### 1. Install Dependencies
```bash
cd 20-debugging-inspector
npm install
```

### 2. Create .env
```env
HTTP_PORT=3020
NODE_ENV=development
```

### 3. Start with Inspector
```bash
node --inspect server.js
```

Output:
```
Debugger listening on ws://127.0.0.1:9229/...
```

### 4. Open DevTools
- Open Chrome: `chrome://inspect`
- Click "inspect" under Node.js target
- DevTools opens with debugger

### 5. Open Frontend
Navigate to: `http://localhost:3020`
