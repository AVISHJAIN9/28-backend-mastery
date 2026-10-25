# Setup Guide - Cron Jobs with Node-Cron

## Prerequisites
- Node.js 14+ installed
- npm or yarn

## Installation

```bash
# Install dependencies
npm install

# Install required packages
npm install express cors helmet dotenv node-cron joi
```

## Environment Variables

Create a `.env` file in the project root:

```bash
# Server Configuration
HTTP_PORT=4002
NODE_ENV=development

# CORS
FRONTEND_URL=http://localhost:3000
```

## Running the Server

```bash
# Development mode (with hot reload)
npm run dev

# Production mode
npm start
```

Server will start on `http://localhost:4002`

## Cron Expression Format

```
┌─────────────────────── minute (0-59)
│ ┌───────────────────── hour (0-23)
│ │ ┌─────────────────── day of month (1-31)
│ │ │ ┌───────────────── month (1-12)
│ │ │ │ ┌─────────────── day of week (0-6, Sunday=0)
│ │ │ │ │
* * * * *
```

### Common Patterns

| Pattern | Description |
|---------|-------------|
| `* * * * *` | Every minute |
| `*/5 * * * *` | Every 5 minutes |
| `0 * * * *` | Every hour |
| `0 0 * * *` | Daily at midnight |
| `0 0 * * 1` | Every Monday |
| `0 9 * * 1-5` | Weekdays at 9 AM |
| `0 0 1 * *` | First day of month |

## API Endpoints

- `POST /api/tasks` - Create new task
- `GET /api/tasks` - List all tasks
- `GET /api/tasks/:taskName` - Get task details
- `PUT /api/tasks/:taskName/pause` - Pause task
- `PUT /api/tasks/:taskName/resume` - Resume task
- `DELETE /api/tasks/:taskName` - Delete task
- `POST /api/tasks/:taskName/trigger` - Execute task immediately
- `GET /api/logs` - Get execution logs
- `GET /api/dashboard` - Dashboard overview

## Testing with cURL

```bash
# Create a task
curl -X POST http://localhost:4002/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "taskName": "Email Cleanup",
    "cronExpression": "0 2 * * *",
    "description": "Clean old emails daily at 2 AM"
  }'

# Get all tasks
curl http://localhost:4002/api/tasks

# Execute task now
curl -X POST http://localhost:4002/api/tasks/Email%20Cleanup/trigger

# Get dashboard
curl http://localhost:4002/api/dashboard
```
