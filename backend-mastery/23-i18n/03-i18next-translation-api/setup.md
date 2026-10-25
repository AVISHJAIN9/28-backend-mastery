# Setup Guide - Module 23.3: i18next Translation API

## Prerequisites

- Node.js v16+ 
- npm or yarn

## Installation

```bash
cd 03-i18next-translation-api
npm install
cp .env.example .env
```

## Environment Variables

```env
HTTP_PORT=5403
NODE_ENV=development
SUPPORTED_LANGUAGES=en,es,fr,de,ja,zh,pt,ar
DEFAULT_LANGUAGE=en
```

## How to Run

```bash
npm run dev
```

## How to Test

```bash
curl "http://localhost:5403/api/translate?key=welcome&language=en"
```
