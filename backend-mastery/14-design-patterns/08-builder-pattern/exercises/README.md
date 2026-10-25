# Builder Pattern - Exercises

## Exercise 1: HTTP Request Builder
Build fluent API for HTTP requests:
```javascript
const request = new RequestBuilder()
  .get('/api/users')
  .withAuth('token')
  .withTimeout(5000)
  .withRetry(3)
  .build();
```

---

## Exercise 2: Email Builder
Create email construction:
- to(email)
- subject(text)
- body(html)
- attachments(files)
- send()

---

## Exercise 3: Database Connection Builder
Build complex database configs:
- host(), port(), database()
- ssl(config)
- pool(size, timeout)
- build()

---

## Solutions
See `../../solutions/` for examples.
