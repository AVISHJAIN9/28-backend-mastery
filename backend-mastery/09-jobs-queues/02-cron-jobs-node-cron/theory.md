# Cron Jobs - Node-Cron Theory

## What are Cron Jobs?

Cron jobs are scheduled tasks that run automatically at specified intervals. Node-cron is a Node.js library for running tasks on a schedule using cron syntax.

### Key Characteristics
```
- Scheduled task execution
- Cron expression syntax
- Timezone support
- Manual start/stop control
- Memory efficient
- Perfect for recurring tasks
```

## Why Use Cron Jobs?

### Common Use Cases
1. **Maintenance Tasks** - Database cleanup, log rotation
2. **Reports** - Generate daily/weekly reports
3. **Notifications** - Send scheduled emails/reminders
4. **Data Sync** - Synchronize data from APIs
5. **Health Checks** - Monitor system status
6. **Batch Processing** - Process data in batches
7. **Backups** - Automated backup schedules

## Cron Expression Format

```
┌───────────── second (0 - 59)
│ ┌───────────── minute (0 - 59)
│ │ ┌───────────── hour (0 - 23)
│ │ │ ┌───────────── day of month (1 - 31)
│ │ │ │ ┌───────────── month (0 - 11)
│ │ │ │ │ ┌───────────── day of week (0 - 6) (0 = Sunday)
│ │ │ │ │ │
│ │ │ │ │ │
* * * * * *
```

### Common Cron Expressions

```javascript
'0 0 * * *'        // Every day at midnight
'0 9 * * 1'        // Every Monday at 9 AM
'0 */6 * * *'      // Every 6 hours
'*/15 * * * *'     // Every 15 minutes
'0 0 1 * *'        // First day of every month
'0 9 * * 1-5'      // Monday-Friday at 9 AM
'30 2 * * *'       // Daily at 2:30 AM
'0 */4 * * *'      // Every 4 hours
```

## Node-Cron Syntax vs Standard Cron

Node-cron adds **seconds** as the first field:

```javascript
// Node-cron (with seconds)
'0 0 0 * * *'      // Every midnight

// Standard Cron (no seconds)
'0 0 * * *'        // Every day at midnight
```

## Basic Usage

### Running a Task Every Day

```javascript
const cron = require('node-cron');

cron.schedule('0 0 * * *', () => {
  console.log('Running daily task at midnight');
});
```

### Running a Task Every Hour

```javascript
cron.schedule('0 * * * * *', () => {
  console.log('Running every hour');
});
```

### Running Every Day at 2 PM

```javascript
cron.schedule('0 14 * * *', () => {
  console.log('Running at 2 PM every day');
});
```

## Timezone Support

```javascript
cron.schedule('0 9 * * 1', () => {
  console.log('Running Monday at 9 AM');
}, {
  timezone: "America/New_York"
});

cron.schedule('0 9 * * 1', () => {
  console.log('Running Monday at 9 AM');
}, {
  timezone: "Europe/London"
});
```

## Controlling Cron Tasks

### Start and Stop Tasks

```javascript
const task = cron.schedule('*/5 * * * *', () => {
  console.log('Running every 5 minutes');
});

// Stop the task
task.stop();

// Start again
task.start();

// Destroy task completely
task.destroy();
```

### Validate Cron Expression

```javascript
const cron = require('node-cron');

const valid = cron.validate('0 * * * * *');
console.log(valid);  // true

const invalid = cron.validate('0 * * * * * * *');
console.log(invalid); // false
```

## Common Patterns

### Pattern 1: Database Cleanup

```javascript
cron.schedule('0 2 * * *', async () => {
  console.log('Running database cleanup at 2 AM');
  
  try {
    // Delete old sessions
    await db.sessions.deleteMany({
      createdAt: { $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    });
    
    // Delete expired tokens
    await db.tokens.deleteMany({
      expiresAt: { $lt: new Date() }
    });
    
    console.log('✅ Cleanup completed');
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  }
});
```

### Pattern 2: Email Notifications

```javascript
cron.schedule('0 9 * * 1', async () => {
  console.log('Running Monday morning email campaign');
  
  try {
    const users = await db.users.find({ subscribed: true });
    
    for (const user of users) {
      await sendEmail(user.email, 'Weekly Newsletter', getTemplate());
    }
    
    console.log(`✅ Sent ${users.length} emails`);
  } catch (error) {
    console.error('❌ Email campaign failed:', error);
  }
});
```

### Pattern 3: Health Checks

```javascript
cron.schedule('*/5 * * * *', async () => {
  console.log('Checking system health every 5 minutes');
  
  const health = {
    timestamp: new Date(),
    redis: await checkRedis(),
    database: await checkDatabase(),
    api: await checkExternalAPI()
  };
  
  // Log to file or send to monitoring service
  await logger.health(health);
});
```

### Pattern 4: Data Synchronization

```javascript
cron.schedule('0 3 * * *', async () => {
  console.log('Syncing data from external API at 3 AM');
  
  try {
    const externalData = await fetchFromAPI();
    
    for (const item of externalData) {
      await db.items.updateOne(
        { externalId: item.id },
        { $set: item },
        { upsert: true }
      );
    }
    
    console.log(`✅ Synced ${externalData.length} items`);
  } catch (error) {
    console.error('❌ Sync failed:', error);
  }
});
```

### Pattern 5: Report Generation

```javascript
cron.schedule('0 8 * * 1', async () => {
  console.log('Generating Monday morning report');
  
  const report = {
    date: new Date(),
    activeUsers: await db.users.countDocuments({ lastLogin: { $gte: Date.now() - 7*24*60*60*1000 } }),
    newUsers: await db.users.countDocuments({ createdAt: { $gte: Date.now() - 7*24*60*60*1000 } }),
    revenue: await db.transactions.aggregate([]).sum('amount')
  };
  
  await sendReportEmail(report);
  await logger.report(report);
});
```

## Error Handling

```javascript
cron.schedule('0 * * * * *', async () => {
  try {
    // Your task
    await performTask();
  } catch (error) {
    console.error('Task failed:', error);
    
    // Send alert
    await sendAlert({
      task: 'hourly-task',
      error: error.message,
      timestamp: new Date()
    });
    
    // Log to monitoring service
    await logger.error('Cron task failed', { error });
  }
});
```

## Production Considerations

1. **Distributed Systems** - Cron runs on every instance (use queues instead)
2. **Task Duration** - If task takes longer than interval, it won't re-run
3. **Timezone** - Always specify timezone for scheduled tasks
4. **Monitoring** - Log all executions and failures
5. **Alerting** - Set up alerts for failed tasks
6. **Database Indexes** - Make sure cleanup queries are indexed
7. **Rate Limiting** - External APIs may have rate limits

## Node-Cron vs BullMQ

```
Node-Cron:
✅ Simple recurring tasks
✅ Memory efficient
❌ Doesn't persist between restarts
❌ Runs on every server instance

BullMQ:
✅ Persists in Redis
✅ Distributed (only runs once across cluster)
✅ Automatic retries
✅ Better for critical tasks
❌ More complex setup
```

