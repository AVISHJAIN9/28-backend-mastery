# Setup Guide - API Versioning Controller

## Installation

```bash
npm install express dotenv
```

## Environment Variables

```env
HTTP_PORT=5027
API_VERSION=v2
DEPRECATED_VERSIONS=v1
```

## Running

```bash
npm start
```

## Testing

```bash
# V1 endpoint
curl http://localhost:5027/api/v1/users

# V2 endpoint
curl http://localhost:5027/api/v2/users

# Header version
curl -H "API-Version: 2" http://localhost:5027/api/users
```
