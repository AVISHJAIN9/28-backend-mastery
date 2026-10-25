# Setup - Image Processing with Sharp

## Prerequisites

- Node.js 18+
- npm or yarn
- MacOS/Linux (Windows with WSL2)

## Installation

### 1. Install Dependencies
```bash
cd 04-image-processing-sharp-webp
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
```

### 3. Start Server
```bash
npm start
# or for development
npm run dev
```

Server runs on http://localhost:6604

## Testing

### With curl
```bash
curl -X POST http://localhost:6604/api/health
```

### With React UI
Open [App.jsx](App.jsx) in browser after starting

## Troubleshooting

### Port Already in Use
```bash
lsof -i :6604
kill -9 <PID>
```

### Sharp Installation Issues
```bash
npm rebuild sharp
```

### Missing Dependencies
```bash
npm install --save
npm audit fix
```

## Next Steps

1. Test health endpoint
2. Try image resizing
3. Test WebP conversion
4. Review theory.md for concepts

Happy coding!
