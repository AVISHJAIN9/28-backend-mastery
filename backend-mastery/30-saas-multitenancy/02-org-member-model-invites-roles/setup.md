# Setup Guide - Organization Members & Invites

## Dependencies

```bash
cd 02-org-member-model-invites-roles
npm install
```

## Environment Variables

Create `.env` file:
```
HTTP_PORT=4002
JWT_SECRET=test-secret-key
FRONTEND_URL=http://localhost:3000
```

## How to Run

```bash
npm start
# Server starts on http://localhost:4002
```

## How to Test

### Via Command Line

```bash
# 1. Get test data
curl http://localhost:4002/api/mock/users

# 2. Login as user 1
curl -X POST http://localhost:4002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"userId": "user-1"}'
# Copy token from response

# 3. Get organization members
curl http://localhost:4002/api/organizations/org-1/members \
  -H "Authorization: Bearer YOUR_TOKEN"

# 4. Invite a user
curl -X POST http://localhost:4002/api/organizations/org-1/invites \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email": "newuser@example.com", "role": "member"}'
```

### Via Browser

Open `preview.html` in browser (includes React testing UI)

## Key Endpoints

- `POST /api/auth/login` - Get JWT token
- `GET /api/organizations/:orgId/members` - List members
- `POST /api/organizations/:orgId/invites` - Send invite
- `POST /api/invites/:inviteId/accept/:token` - Accept invite
- `DELETE /api/organizations/:orgId/members/:memberId` - Remove member
- `PATCH /api/organizations/:orgId/members/:memberId` - Change role
