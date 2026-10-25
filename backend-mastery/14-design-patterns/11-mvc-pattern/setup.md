# Setup Guide - 11-mvc-pattern

## Prerequisites
- Node.js 14+
- npm or yarn
- Basic knowledge of Express.js and React

## Installation

### 1. Install Dependencies
```bash
cd 11-mvc-pattern
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env if needed (defaults work fine)
```

### 3. Start Development Server
```bash
npm run dev
```

Server runs on `http://localhost:3011`

## Quick Test

### Health Check
```bash
curl http://localhost:3011/health
```

### API Info
```bash
curl http://localhost:3011/api/info
```

## Testing the Pattern

1. Review the theory.md for pattern concepts
2. Examine the code structure
3. Test via React UI or cURL
4. Modify code to understand implications
5. Try adding new features

## Key Files to Review

- `theory.md` - Pattern concepts
- `controller.js` - Business logic
- `routes.js` - API endpoints
- `middleware.js` - Request processing
- `App.jsx` - React testing UI

## Common Issues

**Port Already in Use**
```bash
lsof -i :3011  # Find process
kill -9 <PID>      # Kill process
```

**Module Not Found**
```bash
rm -rf node_modules
npm install
```

## Next Steps

1. Study the pattern in theory.md
2. Understand the code structure
3. Modify examples and experiment
4. Apply pattern to your projects
