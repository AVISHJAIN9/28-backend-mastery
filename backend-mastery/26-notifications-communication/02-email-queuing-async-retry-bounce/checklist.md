# Setup & Testing Checklist

## Pre-Setup
- [ ] Node.js 14+ installed (`node --version`)
- [ ] npm installed (`npm --version`)
- [ ] Terminal access in project directory

## Installation
- [ ] Run `npm install`
- [ ] Verify all dependencies installed (`npm list`)

## Configuration
- [ ] Copy `.env.example` to `.env`
- [ ] Set `HTTP_PORT=4002`
- [ ] Set `EMAIL_PROVIDER=nodemailer` for local testing
- [ ] Set `SMTP_HOST=localhost` and `SMTP_PORT=1025`

## Server Setup
- [ ] Start development server: `npm run dev`
- [ ] Verify health check succeeds: `curl http://localhost:4002/health`

## API Testing
- [ ] Queue an email: `POST /api/queue/add`
- [ ] Process queue: `POST /api/queue/process`
- [ ] Get job status: `GET /api/queue/job/1`
- [ ] View all jobs: `GET /api/queue/jobs`
- [ ] Get statistics: `GET /api/queue/stats`
- [ ] Retry failed: `POST /api/queue/retry-failed`
- [ ] List DLQ: `GET /api/dlq/items`
- [ ] Bounce webhook: `POST /api/bounces/webhook`

## Testing Scenarios
- [ ] Queue email with high priority
- [ ] Queue email with low priority
- [ ] Process and verify priority ordering
- [ ] Simulate email failure and verify retry
- [ ] Verify exponential backoff delays
- [ ] Simulate hard bounce and check DLQ
- [ ] Retry from DLQ
- [ ] Monitor queue stats changes

## Debugging
- [ ] Check `/api/queue/jobs` for stuck jobs
- [ ] Monitor `/api/queue/stats` for health
- [ ] Review `/api/dlq/items` for failed emails
- [ ] Check logs for detailed error messages

## Production Readiness
- [ ] All manual tests pass
- [ ] Queue health metrics normal
- [ ] No infinite loops in retry logic
- [ ] DLQ cleanup process defined
- [ ] Monitoring and alerting configured
- [ ] Error handling for all scenarios

**Ready for next module!**
- [ ] Written middleware
- [ ] Tested manually
- [ ] Written tests
- [ ] Reviewed edge cases
