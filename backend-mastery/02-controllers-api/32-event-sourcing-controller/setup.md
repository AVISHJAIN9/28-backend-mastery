# Setup Guide - Event Sourcing Controller

## Installation

```bash
npm install express pg dotenv uuid
```

## Event Store Table

```sql
CREATE TABLE events (
  id UUID PRIMARY KEY,
  aggregate_id UUID NOT NULL,
  type VARCHAR(100) NOT NULL,
  data JSONB NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_aggregate ON events(aggregate_id);
```

## Running

```bash
npm start
```

## Testing

```bash
# Create event
curl -X POST http://localhost:5032/api/events \\
  -d '{"type":"AccountCreated","data":{"name":"John"}}'

# Get aggregate
curl http://localhost:5032/api/aggregate/:id

# Replay events
curl http://localhost:5032/api/replay/:id
```
