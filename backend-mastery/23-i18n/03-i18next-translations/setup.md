# Setup Guide - Module 23.4: i18next Translations

## Installation

```bash
cd 03-i18next-translations
npm install
cp .env.example .env
```

## Environment Variables

```env
HTTP_PORT=5404
NODE_ENV=development
SUPPORTED_LANGUAGES=en,es,fr,de,ja,zh,pt,ar,ko
DEFAULT_LANGUAGE=en
```

## How to Run

```bash
npm run dev
```

## How to Test

```bash
curl "http://localhost:5404/api/translations/en"
```

3. Update .env with your configuration

## Local Development

```bash
npm run dev
```

Server will start with hot reload via nodemon.

## Production

```bash
npm start
```

## Testing

Run the React UI test application:
```bash
npm run test
```

Or test via API directly:
```bash
curl http://localhost:3000/health
```

## Troubleshooting

### Port Already in Use
```bash
lsof -ti:3000 | xargs kill -9
```

### Dependencies Issue
```bash
rm -rf node_modules package-lock.json
npm install
```

### Environment Variables
Ensure all required env vars are set in .env file.
