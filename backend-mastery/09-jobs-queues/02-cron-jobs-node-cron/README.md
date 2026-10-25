# 02 - Cron Jobs with Node-Cron

Schedule and manage recurring background tasks in Node.js using time-based execution with cron expressions.

## 🎯 What You'll Learn

- Cron expression syntax and patterns
- Scheduling recurring tasks with Node-Cron  
- Managing task lifecycle (pause, resume, delete)
- Monitoring task execution and logs
- Building a task scheduler dashboard
- Common scheduling use cases

## 📋 Quick Start

```bash
# Install and run
npm install
npm run dev

# Server runs on http://localhost:4002
```

## 📚 Cron Expression Format

```
* * * * *
│ │ │ │ └─ Day of Week (0-6, Sunday=0)
│ │ │ └─── Month (1-12)
│ │ └───── Day of Month (1-31)
│ └─────── Hour (0-23)
└───────── Minute (0-59)
```

## 🎨 Common Patterns

| Pattern | Meaning | Example |
|---------|---------|---------|
| `* * * * *` | Every minute | Frequent checks |
| `*/5 * * * *` | Every 5 minutes | Cache refresh |
| `0 * * * *` | Every hour | Hourly reports |
| `0 0 * * *` | Daily (midnight) | Daily backup |
| `0 2 * * *` | 2 AM daily | Maintenance |
| `0 9 * * 1-5` | 9 AM weekdays | Business reports |
| `0 0 1 * *` | 1st of month | Monthly summary |

## 🚀 API Endpoints

```bash
# Create task
POST /api/tasks
{
  "taskName": "Database Backup",
  "cronExpression": "0 2 * * *",
  "description": "Daily backup at 2 AM"
}

# Get all tasks
GET /api/tasks

# Execute task now
POST /api/tasks/:taskName/trigger

# Pause/Resume
PUT /api/tasks/:taskName/pause
PUT /api/tasks/:taskName/resume

# Delete task
DELETE /api/tasks/:taskName

# Get logs
GET /api/logs
GET /api/logs/:taskName

# Dashboard
GET /api/dashboard
```

## 💡 Example Usage

### Email Cleanup  
```javascript
// Remove old emails daily at 2 AM
cron.schedule('0 2 * * *', async () => {
  await deleteOldEmails();
});
```

### Cache Warming
```javascript
// Update cache every 30 minutes
cron.schedule('*/30 * * * *', async () => {
  await updatePopularItems();
});
```

### Database Backup
```javascript
// Backup database at 3 AM every day
cron.schedule('0 3 * * *', async () => {
  await backupDatabase();
});
```

## ⚡ Key Features

✅ Create and manage scheduled tasks  
✅ Pause/resume tasks  
✅ Execute tasks on-demand  
✅ Real-time execution logs  
✅ Task status monitoring  
✅ Dashboard overview  
✅ Cron expression validation  

## ⚠️ Common Mistakes

1. **Wrong expression format**
   ```javascript
   // ❌ Wrong
   cron.schedule('2 AM', callback);
   
   // ✅ Correct
   cron.schedule('0 2 * * *', callback);
   ```

2. **No error handling**
   ```javascript
   // ❌ Silent failures
   cron.schedule('0 * * * *', riskyTask);
   
   // ✅ Proper error handling
   cron.schedule('0 * * * *', async () => {
     try { await riskyTask(); }
     catch (e) { logger.error(e); }
   });
   ```

3. **Blocking operations**
   ```javascript
   // ❌ Blocks event loop
   cron.schedule('* * * * *', () => {
     heavySync();
   });
   
   // ✅ Non-blocking
   cron.schedule('* * * * *', async () => {
     await heavyAsync();
   });
   ```

## 📊 Real-World Use Cases

- **E-Commerce**: Nightly inventory sync, daily sales reports, cart reminders
- **SaaS**: Monthly billing, hourly health checks, daily notifications
- **Social Media**: Trending updates, engagement digests, content recommendations
- **Content**: Scheduled publishing, trending compilation, newsletter generation

## 🎓 Learning Path

1. Understand cron syntax  
2. Create your first scheduled task
3. Monitor task execution
4. Handle errors gracefully
5. Build monitoring dashboard
6. Deploy with persistence

---

**Status**: ✅ Complete | **Complexity**: Intermediate | **Time**: 30-45 min
