# Factory Pattern - Exercises

## Exercise 1: Transport Factory
Create a factory that produces different transport objects:
- Car (wheels: 4, fuel: 'petrol')
- Bike (wheels: 2, fuel: 'petrol')
- Bus (wheels: 6, fuel: 'diesel')

Each should have: start(), stop(), getInfo()

**Steps:**
1. Create three transport classes
2. Create TransportFactory with static createTransport(type)
3. Test creating each type

---

## Exercise 2: Logger Factory
Build a factory for different logger types:
- ConsoleLogger - logs to console
- FileLogger - logs to file
- DatabaseLogger - logs to database

Each logger should have: log(message), warn(message), error(message)

**Bonus:** Add a default logger type configuration

---

## Exercise 3: REST API Client Factory
Create a factory that produces different API clients:
- HtmlClient - for REST APIs returning HTML
- JsonClient - for REST APIs returning JSON
- XMLClient - for REST APIs returning XML

Implement: fetch(endpoint), parse(response)

---

## Exercise 4: Notification Factory
Build a notification system:
- EmailNotification
- SMSNotification
- PushNotification (mobile)
- SlackNotification

Each should have: send(recipient, message)

**Challenge:** How would you queue multiple notifications?

---

## Exercise 5: Detect and Fix Factory Misuse
Look at this code and identify factory pattern violations:

```javascript
const userService = require('./services/UserService');
const postService = require('./services/PostService');
const commentService = require('./services/CommentService');

function processEntity(type, data) {
  if (type === 'user') return new UserService(data);
  if (type === 'post') return new PostService(data);
  if (type === 'comment') return new CommentService(data);
}
```

What improvements would you make?

---

## Solutions
See `../../solutions/` for complete solutions with test cases.
