# Implementation Checklist - Optimistic Locking

## Planning
- [ ] Understand lost update problem
- [ ] Read theory.md
- [ ] Identify tables needing versioning
- [ ] Plan retry strategy

## Database
- [ ] Add version INT column (default 1)
- [ ] Create index on version
- [ ] Verify version increments

## Backend
- [ ] listProducts()
- [ ] getProduct()
- [ ] createProduct() - sets version=1
- [ ] updateProductSecure() - checks version, increments
- [ ] updateProductVulnerable() - for demo
- [ ] retryUpdate() - exponential backoff
- [ ] getVersionHistory()
- [ ] Middleware validation
- [ ] Error handling (409 on conflict)
- [ ] Logging for conflicts

## Frontend
- [ ] Product list display
- [ ] Edit form with version show
- [ ] Secure update button
- [ ] Vulnerable update button (demo)
- [ ] Conflict display
- [ ] Retry/resolve button
- [ ] Version history view
- [ ] API response display

## Documentation
- [ ] README.md complete
- [ ] theory.md with examples
- [ ] setup.md with curl commands
- [ ] checklist.md (this file)
- [ ] .env.example configured

## Testing
- [ ] Successful update increments version
- [ ] Wrong version returns 409
- [ ] Retry with new version succeeds
- [ ] Multiple concurrent updates handled
- [ ] React UI works end-to-end
- [ ] Curl commands all work
- [ ] Vulnerable endpoint bypasses check

## Deployment
- [ ] Environment variables set
- [ ] Server starts correctly
- [ ] All endpoints accessible
- [ ] Conflict metrics logged
- [ ] Performance acceptable
- [ ] Ready for production

---

✅ **All items checked?** Module complete!
