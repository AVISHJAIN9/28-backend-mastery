# Setup Guide: Timers Deep Dive

## Prerequisites
- Node.js 14.0+
- npm or yarn

## Installation

### 1. Install Dependencies
```bash
cd 19-timers-deep-dive
npm install
```

### 2. Create .env
```env
HTTP_PORT=3019
NODE_ENV=development
```

### 3. Start Server
```bash
npm start
```

### 4. Open Frontend
Navigate to: `http://localhost:3019`

## File Structure
```
19-timers-deep-dive/
├── server.js
├── routes.js
├── controller.js
├── middleware.js
├── schema.js
├── App.jsx
└── package.json
```

## Testing
- `GET /api/timers/order` - Timer execution order
- `POST /api/timers/precision` - Measure accuracy
- `GET /api/timers/performance` - Load testing
