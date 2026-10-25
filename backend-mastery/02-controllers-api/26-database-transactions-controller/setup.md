# Setup Guide - Database Transactions Controller

## Installation

```bash
npm install pg express dotenv
```

## Database Setup

```sql
CREATE TABLE accounts (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  balance DECIMAL(10, 2)
);
```

## Environment Variables

```env
HTTP_PORT=5026
DB_CONNECTION=postgresql://user:pass@localhost/dbname
```

## Running

```bash
npm start
```

## Testing

```bash
# Transfer between accounts
curl -X POST http://localhost:5026/api/transfer \\
  -d '{"from":1,"to":2,"amount":100}'
```
