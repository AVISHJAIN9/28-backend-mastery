# 06 - Priority Queues

Process jobs based on priority levels, ensuring critical tasks are handled first.

## 🎯 Key Concepts

- **Critical (0)**: Security alerts, immediate action needed
- **High (1)**: User-triggered, important operations
- **Normal (5)**: Regular operational tasks
- **Low (10)**: Background work, optimization

## 📋 Priority Levels

```
Critical  → Process FIRST
High      → Process ASAP
Normal    → Process in order
Low       → Process when free
```

## 🚀 Quick Start

```bash
npm install
npm run dev
```

Server: `http://localhost:4006`

## 📚 API

```bash
# Submit job with priority
POST /api/jobs
{
  "taskId": "task-123",
  "data": {...},
  "priority": "high"  # critical, high, normal, low
}

# Get all jobs
GET /api/jobs

# Get priority levels
GET /api/levels

# Get dashboard
GET /api/dashboard
```

## 💡 Examples

### Critical: Security Alert
```javascript
{
  taskId: "security-breach-123", 
  priority: "critical",
  data: { alertType: "unauthorized_access" }
}
```

### High: User Payment
```javascript
{
  taskId: "payment-456",
  priority: "high",
  data: { orderId: "ORD-789" }
}
```

### Normal: Email Campaign
```javascript
{
  taskId: "campaign-001",
  priority: "normal",
  data: { campaignId: "CAMP-123" }
}
```

### Low: Cleanup
```javascript
{
  taskId: "cleanup-001",
  priority: "low",
  data: { hoursOld: 24 }
}
```

## ⚡ Benefits

✅ Critical tasks processed first
✅ Better resource utilization  
✅ Improved user experience
✅ Fair queuing

## 🌍 Real-World Use Cases

- E-commerce: Premium customers get higher priority
- Banking: Critical transactions before routine ones
- SaaS: VIP users get priority support

---

**Status**: ✅ Complete | **Complexity**: Intermediate | **Time**: 20-30 min

