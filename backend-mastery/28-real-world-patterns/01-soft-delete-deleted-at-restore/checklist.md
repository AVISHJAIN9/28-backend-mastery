# Implementation Checklist - Soft Delete Pattern

## Planning Phase

- [ ] **Understand the concept**
  - Read README.md for overview
  - Review theory.md for deep dive
  - Understand hard vs soft delete tradeoffs

- [ ] **Determine retention policy**
  - How long to keep deleted records?
  - When to hard delete?
  - Compliance requirements (GDPR, CCPA)?

- [ ] **Identify all entities**
  - Which tables need soft delete?
  - User data? Posts? Comments?
  - Related/dependent records?

- [ ] **Plan indexes**
  - Which columns to index?
  - Query patterns to optimize?
  - Performance goals?

## Database Schema Phase

- [ ] **Add deleted_at column**
  ```sql
  ALTER TABLE users ADD COLUMN deleted_at TIMESTAMP NULL;
  ```

- [ ] **Add restored_at column** (optional)
  ```sql
  ALTER TABLE users ADD COLUMN restored_at TIMESTAMP NULL;
  ```

- [ ] **Create necessary indexes**
  ```sql
  CREATE INDEX idx_users_deleted_at ON users(deleted_at);
  CREATE INDEX idx_users_active_email ON users(deleted_at, email);
  ```

- [ ] **Add constraints**
  - Check that email is unique only for active users
  - Or allow duplicates for deleted accounts

- [ ] **Update schema documentation**
  - Document deleted_at meaning
  - Document retention policy
  - Document queries that must filter

## Backend Implementation Phase

### Controller Layer

- [ ] **Implement listActiveUsers()**
  - Filter where deleted_at IS NULL
  - Pagination support
  - Logging

- [ ] **Implement getUserSecure()**
  - Check user exists
  - Check user is not deleted
  - Return 404 if deleted

- [ ] **Implement createUser()**
  - Validate input
  - Check email doesn't exist (even if deleted)
  - Set deleted_at to null initially
  - Return created user

- [ ] **Implement updateUser()**
  - Check user exists and not deleted
  - Validate update fields
  - Prevent changing deleted_at
  - Update updated_at timestamp

- [ ] **Implement softDeleteUser()**
  - Check user exists
  - Check not already deleted
  - Set deleted_at to current time
  - Log deletion event
  - Return soft-deleted user

- [ ] **Implement restoreUser()**
  - Check user exists
  - Check user is deleted
  - Clear deleted_at (set to null)
  - Set restored_at timestamp
  - Log restore event
  - Return restored user

- [ ] **Implement getUserAuditTrail()**
  - Return user with all timestamps
  - Show deletion and restore history
  - Show current status (ACTIVE/DELETED)

### Route Layer

- [ ] **Create secure routes**
  ```javascript
  router.get('/secure/users', listActiveUsers);
  router.get('/secure/users/:id', getUserSecure);
  router.post('/secure/users', createUser);
  router.patch('/secure/users/:id', updateUser);
  router.delete('/secure/users/:id', softDeleteUser);
  router.post('/secure/users/:id/restore', restoreUser);
  router.get('/secure/users/:id/audit-trail', getUserAuditTrail);
  ```

- [ ] **Create admin routes**
  ```javascript
  router.get('/admin/deleted-users', listDeletedUsers);
  ```

- [ ] **Create educational vulnerable routes**
  ```javascript
  router.get('/vulnerable/users', listAllUsersVulnerable);
  router.get('/vulnerable/users/:id', getUserVulnerable);
  router.delete('/vulnerable/users/:id/hard-delete', hardDeleteUser);
  ```

### Middleware Layer

- [ ] **Implement input validation**
  - validateCreateUser()
  - validateUpdateUser()
  - validateId()
  - validateQuery()

- [ ] **Implement error handling**
  - Proper HTTP status codes
  - Meaningful error messages
  - Logging of errors

- [ ] **Implement request logging**
  - Log all database operations
  - Log deletion/restore events
  - Include user identifier and timestamp

## Frontend Implementation Phase

- [ ] **Create React component (App.jsx)**
  - State management with useState
  - API calls with fetch
  - Form inputs for testing

- [ ] **Implement UI sections**
  - [ ] Secure operations (green section)
    - List active users button
    - Get user by ID input
    - Create user form
    - Soft delete button
    - Restore button
    - Audit trail button
  
  - [ ] Vulnerable operations (red section)
    - List all users (including deleted)
    - Hard delete button
    - List deleted users only

- [ ] **Implement response display**
  - Format JSON response
  - Show status code
  - Display timestamps
  - Show success/error messages

- [ ] **Add interactivity**
  - Input validation
  - Loading states
  - Error messages
  - Clear feedback

## Documentation Phase

- [ ] **Complete README.md**
  - [ ] Overview section
  - [ ] Problem statement
  - [ ] Solution explanation
  - [ ] API endpoints table
  - [ ] Real-world examples
  - [ ] Common mistakes
  - [ ] Security considerations
  - [ ] Data schema example

- [ ] **Complete theory.md**
  - [ ] Concept overview
  - [ ] Database design
  - [ ] Implementation strategies
  - [ ] Query patterns
  - [ ] Compliance requirements
  - [ ] Performance implications
  - [ ] Architecture patterns
  - [ ] Comparison with alternatives
  - [ ] Advanced scenarios

- [ ] **Complete setup.md**
  - [ ] Prerequisites
  - [ ] Installation steps
  - [ ] Environment configuration
  - [ ] Starting the server
  - [ ] API testing examples
  - [ ] Curl commands
  - [ ] Expected responses
  - [ ] Troubleshooting guide

- [ ] **Add code comments**
  - Comment complex logic
  - Explain security decisions
  - Note edge cases
  - Document indexes

## Testing Phase

- [ ] **Unit tests**
  - Test listActiveUsers with both active and deleted
  - Test getUserSecure with deleted user (should 404)
  - Test softDeleteUser sets timestamp
  - Test restoreUser clears timestamp
  - Test duplicate email creation fails

- [ ] **Integration tests**
  - Test full create → delete → restore cycle
  - Test audit trail shows history
  - Test hard delete is permanent
  - Test concurrent operations

- [ ] **Manual testing with curl**
  ```bash
  - [ ] List active users
  - [ ] Create new user
  - [ ] Soft delete user
  - [ ] Verify user is hidden
  - [ ] Restore user
  - [ ] Verify user is visible again
  ```

- [ ] **Manual testing with React UI**
  - [ ] All buttons work
  - [ ] Response displays correctly
  - [ ] Errors are handled
  - [ ] Timestamps show correctly

- [ ] **Edge case testing**
  - [ ] Delete non-existent user → 404
  - [ ] Delete already-deleted user → error
  - [ ] Restore non-deleted user → error
  - [ ] Update deleted user → 404

## Security Phase

- [ ] **Access control**
  - [ ] Restore requires admin role
  - [ ] Hard delete requires admin role
  - [ ] Regular users can only delete their own

- [ ] **Input validation**
  - [ ] All inputs validated with Joi
  - [ ] SQL injection impossible (parameterized)
  - [ ] XSS prevention in responses

- [ ] **Authentication**
  - [ ] Optional: Add JWT token requirement
  - [ ] Check token in middleware
  - [ ] Extract user from token

- [ ] **Audit logging**
  - [ ] Log all deletions with user info
  - [ ] Log all restores with user info
  - [ ] Log hard deletes (permanent operations)
  - [ ] Include timestamp and reason

- [ ] **Compliance**
  - [ ] Document retention policy
  - [ ] Document GDPR compliance
  - [ ] Document backup strategy
  - [ ] Schedule auto hard-delete process

## Performance Optimization Phase

- [ ] **Query optimization**
  - [ ] Index on deleted_at column exists
  - [ ] Index on (deleted_at, created_at) exists
  - [ ] Query plans reviewed in database

- [ ] **Caching (optional)**
  - [ ] Cache list of active users
  - [ ] Invalidate cache on create/delete
  - [ ] TTL on cache entries

- [ ] **Pagination (optional)**
  - [ ] Implement cursor-based pagination
  - [ ] Or offset pagination
  - [ ] Limit query results

- [ ] **Monitoring**
  - [ ] Track number of active users
  - [ ] Track number of deleted users
  - [ ] Monitor query performance
  - [ ] Alert on slow queries

## Configuration Phase

- [ ] **Environment variables**
  - [ ] NODE_ENV set
  - [ ] HTTP_PORT set
  - [ ] DB_HOST/PORT configured
  - [ ] LOG_LEVEL set
  - [ ] Create .env.example file

- [ ] **.env.example file**
  - [ ] All required variables documented
  - [ ] Sensible defaults shown
  - [ ] Comments explaining each variable

- [ ] **package.json updates**
  - [ ] Scripts for start, dev, test
  - [ ] All dependencies listed
  - [ ] Version numbers specified

## Deployment Phase

- [ ] **Production build**
  - [ ] Code is optimized
  - [ ] No console logs in production
  - [ ] Error handling is robust

- [ ] **Database migration**
  - [ ] Migration script created
  - [ ] Can be run on existing data
  - [ ] Rollback strategy exists

- [ ] **Monitoring setup**
  - [ ] Error logging configured
  - [ ] Performance monitoring active
  - [ ] Alerts configured

- [ ] **Retention cleanup job**
  - [ ] Scheduled task for hard delete
  - [ ] Respects retention policy
  - [ ] Logs hard deletions

## Post-Implementation Phase

- [ ] **Team training**
  - [ ] Team understands soft delete pattern
  - [ ] All queries include deleted_at filter
  - [ ] Team knows when to use restores

- [ ] **Documentation review**
  - [ ] All documentation is accurate
  - [ ] Examples are working
  - [ ] No outdated info

- [ ] **Monitoring**
  - [ ] Set up alerts for errors
  - [ ] Track deletion patterns
  - [ ] Monitor performance

- [ ] **Backup strategy**
  - [ ] Regular backups configured
  - [ ] Test restore procedures
  - [ ] Document backup retention

## Final Verification Checklist

- [ ] All endpoints working as specified
- [ ] All validations in place
- [ ] Error messages are clear
- [ ] Logging is comprehensive
- [ ] Security is robust
- [ ] Documentation is complete
- [ ] Tests are passing
- [ ] Performance is acceptable
- [ ] Production ready

---

## Statistics

| Item | Count |
|------|-------|
| Endpoints | 10 |
| Database operations | 7 |
| Validations | 4 |
| Tests | 15+ |
| Documentation pages | 4 |
| Code examples | 20+ |

## Time Estimates

- Planning: 1-2 hours
- Database setup: 30 minutes
- Backend implementation: 2-3 hours
- Frontend implementation: 1-2 hours
- Testing: 1-2 hours
- Documentation: 1-2 hours
- **Total: 7-13 hours**

---

✅ **Once all items are checked, module is complete!**

- [ ] Written middleware
- [ ] Tested manually
- [ ] Written tests
- [ ] Reviewed edge cases
