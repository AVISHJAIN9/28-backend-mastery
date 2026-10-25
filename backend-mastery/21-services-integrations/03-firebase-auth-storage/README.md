# Firebase Authentication & Cloud Storage

## What is this?

This module demonstrates Firebase's core features:
- **Authentication**: User registration, login, JWT token generation
- **Cloud Storage**: File upload/download with access control
- **Firestore Database**: Real-time document storage and queries

## Why does it matter?

Firebase provides a complete backend-as-a-service (BaaS) solution, reducing infrastructure management and allowing developers to focus on application logic. Enterprise use cases include user onboarding flows, document management systems, and collaborative applications.

## How it works (step by step)

1. **User Registration**: POST `/api/auth/register` with email/password → Creates user in Firebase Auth
2. **Login**: POST `/api/auth/login` → Returns JWT token valid for 3600 seconds
3. **Profile Management**: GET/PUT `/api/profile` → Requires Bearer token
4. **Document Creation**: POST `/api/documents` → Creates Firestore document with user ownership
5. **File Upload**: POST `/api/files/upload` → Stores file in Cloud Storage with download URL

## Key concepts

- **JWT Tokens**: Stateless authentication using Bearer tokens in Authorization header
- **User Ownership**: All documents/files scoped to authenticated user (req.uid)
- **Public/Private Documents**: Documents have `public` flag allowing sharing
- **Document Versioning**: Track createdAt/updatedAt timestamps
- **Permissions**: All endpoints protected by `verifyIdToken` middleware

## Common mistakes

1. **Storing plaintext passwords** → Use bcrypt for hashing
2. **No token expiration** → Set expiresIn field on JWT tokens
3. **Missing permission checks** → Always verify user ownership before returning data
4. **Insufficient validation** → Use Joi schemas on all endpoints
5. **Exposing sensitive errors** → Catch exceptions and return generic error messages

## Real world usage

**Google Docs Alternative**: Users register, create documents, invite others, real-time collaboration on Firestore
**File Sharing**: Users upload files, generate share links, track downloads
**User Profiles**: Profile pictures stored in Cloud Storage, metadata in Firestore

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user, return JWT
- `POST /api/auth/logout` - Logout (client-side token deletion)

### Profile
- `GET /api/profile` - Get current user profile
- `PUT /api/profile` - Update profile (name, photo, phone)

### Documents
- `POST /api/documents` - Create document
- `GET /api/documents` - List user's documents
- `GET /api/documents/:id` - Get document (with permission check)
- `PUT /api/documents/:id` - Update document
- `DELETE /api/documents/:id` - Delete document

### Files
- `POST /api/files/upload` - Upload file
- `GET /api/files` - List user's files
- `DELETE /api/files/:id` - Delete file

## Quick Start

```bash
npm install
node server.js
# Running on http://localhost:6303
```

## Testing

Use the React UI or curl:

```bash
# Register
curl -X POST http://localhost:6303/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","password":"password123","displayName":"Test User"}'

# Login
curl -X POST http://localhost:6303/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","password":"password123"}'

# Create Document (use token from login response)
curl -X POST http://localhost:6303/api/documents \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{"title":"My Doc","content":"Hello World"}'
```
