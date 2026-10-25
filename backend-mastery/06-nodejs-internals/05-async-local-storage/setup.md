# AsyncLocalStorage - Setup & Usage

## Installation

```bash
npm init -y
npm install express
```

## Basic Setup

```javascript
const { AsyncLocalStorage } = require('async_hooks');

const storage = new AsyncLocalStorage();

app.use((req, res, next) => {
  storage.run({ requestId: req.id }, () => {
    next();
  });
});
```

## Testing Context

```bash
npm test
```

## Nested Context Testing

Run examples with multiple contexts to verify isolation.
