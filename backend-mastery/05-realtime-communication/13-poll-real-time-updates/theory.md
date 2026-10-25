# Real-Time Polls - Theory

## Poll Lifecycle

```
1. Poll Created
   ├─ Define question
   ├─ Add options
   ├─ Set expiry
   └─ Open for voting

2. Voting
   ├─ Users cast votes (one per user)
   ├─ Votes counted immediately
   ├─ Results updated live
   └─ Other users see changes

3. Poll Closed
   ├─ Time expired
   ├─ Organizer closed
   └─ Final results frozen
```

## Vote Tracking

### Simple Counter
```javascript
const poll = {
  options: {
    'Option A': 5,
    'Option B': 3,
    'Option C': 2
  }
};

// Pro: Simple
// Con: Can't prevent double voting
```

### Voter Validation
```javascript
const poll = {
  options: {
    'Option A': 5,
    'Option B': 3
  },
  voters: Set(['user1', 'user2', 'user3'...]),
  votes: Map({
    'user1': 'Option A',
    'user2': 'Option B'
  })
};

// Pro: Prevents cheating
// Con: More memory
```

## Real-Time Updates

### Server Broadcasting
```javascript
socket.on('poll:vote', (pollId, option, userId) => {
  const poll = polls.get(pollId);
  
  if (poll.voters.has(userId)) {
    return socket.emit('error', 'Already voted');
  }
  
  poll.voters.add(userId);
  poll.votes.set(userId, option);
  poll.options[option]++;
  
  // Broadcast to all poll viewers
  io.to(`poll:${pollId}`).emit('poll:updated', {
    options: poll.options,
    totalVotes: poll.voters.size
  });
});
```

### Live Percentage Calculation
```javascript
function getPercentages(poll) {
  const total = poll.voters.size;
  const percentages = {};
  
  for (const [option, count] of Object.entries(poll.options)) {
    percentages[option] = total > 0 
      ? ((count / total) * 100).toFixed(1)
      : 0;
  }
  
  return percentages;
}

// Broadcast with percentages
io.to(`poll:${pollId}`).emit('poll:results', {
  options: poll.options,
  percentages: getPercentages(poll),
  totalVotes: poll.voters.size
});
```

## Preventing Fraud

### One Vote Per User
```
Track userId in voters set
Check before accepting vote
Reject if already voted
```

### Rate Limiting
```
Limit votes per IP/user per minute
Prevent rapid vote switching
```

### Validation
```
- Verify user logged in
- Check poll still open
- Validate option exists
- Verify vote timestamp reasonable
```

## Poll States

### Active
```
Accepting votes
Results visible
Can join anytime
```

### Closed
```
No more votes accepted
Results final
Voting disabled
```

### Archived
```
Poll completed hours/days ago
Results only
Can't interact
```

## Poll Types

### Public Poll
```
Anyone can see
Anyone can vote
Results public
```

### Private Poll
```
Invited users only
Results private
Can't find via search
```

### Anonymous Poll
```
Vote recorded
Voter identity hidden
Only admins see who voted
```

## Real-Time Challenges

### Problem: Poll Overflow
```
1 million users voting
Broadcasts every vote update to all
= 1 million websocket messages

Solution:
- Batch updates (combine updates)
- Throttle broadcasts (every 100 votes)
- Use rooms to limit scope
```

### Problem: Vote Changing
```
User changes mind, votes for different option
Old vote count decreases, new vote increases
Need to track old vote to decrement

Solution:
- Store user's previous vote
- When new vote comes in, decrement old option
```

## Results Display

### Live Leaderboard
```
Rank by votes
Top option first
Show percentage
Show vote count
```

### Pie Chart
```
Visual representation
Percentage per option
Total votes
```

### Bar Chart
```
Option on Y-axis
Vote count on X-axis
Updates in real-time
```

## Expiry Handling

### Time-Based Expiry
```javascript
setTimeout(() => {
  poll.active = false;
  io.to(`poll:${pollId}`).emit('poll:closed', {
    options: poll.options
  });
}, poll.expiryTime);
```

### Vote Counting After Close
```
No new votes accepted
Results calculated
Poll moved to archived
Results queryable by history
```

## Best Practices

✅ Prevent double voting
✅ Show real-time results
✅ Implement expiry
✅ Batch updates on high load
✅ Save poll results to database
✅ Allow anonymous voting option
✅ Show total votes count
✅ Calculate percentages server-side
✅ Validate all votes before counting
✅ Test with large user base
