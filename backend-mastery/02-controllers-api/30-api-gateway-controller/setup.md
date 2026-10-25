# Setup Guide - API Gateway Controller

## Installation

```bash
npm install express http-proxy dotenv
```

## Configuration

```env
HTTP_PORT=5030
SERVICE1_URL=http://service1:3001
SERVICE2_URL=http://service2:3002
```

## Running

```bash
npm start
```

## Testing

```bash
# Route to service 1
curl http://localhost:5030/service1/api/users

# Route to service 2
curl http://localhost:5030/service2/api/products
```
