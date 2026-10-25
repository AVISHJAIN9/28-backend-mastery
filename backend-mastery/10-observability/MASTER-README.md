# Logging, Monitoring & Observability

**Module Code:** 10-observability

## What You'll Learn

Winston, Pino, Prometheus, Grafana, Datadog, OpenTelemetry

### Core Topics

- **01 Structured Logging Winston Pino** - Practical implementation
- **02 Log Levels Debug Info Warn Error** - Practical implementation
- **03 Correlation Id Per Request** - Practical implementation
- **04 Error Tracking Sentry** - Practical implementation
- **05 Health Check Endpoints** - Practical implementation
- **06 Metrics Prometheus Grafana** - Practical implementation
- **07 Apm Datadog Newrelic** - Practical implementation
- **08 Distributed Tracing Opentelemetry** - Practical implementation
- **09 Uptime Monitoring Slas** - Practical implementation


## Learning Objectives

By completing this module, you will:

✅ Understand core concepts and patterns  
✅ Implement production-ready code  
✅ Best practices and anti-patterns  
✅ Real-world applications  
✅ Performance optimization  
✅ Security considerations  

## Getting Started

### 1. Start with Theory
Read `theory.md` in the first lesson

### 2. Setup Environment
```bash
cd [first-lesson]
npm install
cp .env.example .env
```

### 3. Run Server
```bash
npm run dev
```

### 4. Open React UI
Navigate to http://localhost:3000

### 5. Test Endpoints
Use the interactive UI to test all endpoints

## Lesson Breakdown

| # | Topic | Complexity | Time |
|---|-------|-----------|------|
| 1 | 01 Structured Logging Winston Pino | Intermediate | 30 min |
| 2 | 02 Log Levels Debug Info Warn Error | Intermediate | 30 min |
| 3 | 03 Correlation Id Per Request | Intermediate | 30 min |
| 4 | 04 Error Tracking Sentry | Intermediate | 30 min |
| 5 | 05 Health Check Endpoints | Intermediate | 30 min |
| 6 | 06 Metrics Prometheus Grafana | Intermediate | 30 min |
| 7 | 07 Apm Datadog Newrelic | Intermediate | 30 min |
| 8 | 08 Distributed Tracing Opentelemetry | Intermediate | 30 min |
| 9 | 09 Uptime Monitoring Slas | Intermediate | 30 min |


## Architecture

```
10-observability/
├── 01-[lesson]/
│   ├── server.js
│   ├── routes.js
│   ├── controller.js
│   ├── middleware.js
│   ├── schema.js
│   ├── theory.md
│   ├── README.md
│   ├── App.jsx
│   ├── package.json
│   ├── .env.example
│   ├── setup.md
│   └── checklist.md
├── 02-[lesson]/
├── ...
├── INDEX.md
├── MASTER-README.md
└── COMPLETION-SUMMARY.md
```

## Technology Stack

### Backend
- Express.js 4.18+
- Node.js 16+
- Winston / Pino (logging)
- Helmet (security)
- CORS

### Frontend
- React 18
- Fetch API
- CSS3

### Testing
- Manual API testing
- Interactive React UI

## Best Practices

1. **Read theory first** - Understand concepts
2. **Run server** - See it in action
3. **Test endpoints** - Use React UI
4. **Review code** - Study implementations
5. **Modify & experiment** - Learn by doing

## Prerequisites

- Node.js 16+
- npm or yarn
- Basic JavaScript knowledge
- Express.js familiarity
- React fundamentals (for UI)

## Support

- Check theory.md for concepts
- Review README.md for setup
- Look at code comments for implementation
- Follow checklist.md for verification

## Certificate of Completion

Finish all 9 lessons and earn mastery in Logging, Monitoring & Observability!
