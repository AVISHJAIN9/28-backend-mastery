# Firebase Security: Theory & Concepts

## 1. Authentication & Authorization

### Firebase Authentication Architecture

Firebase Authentication provides multiple sign-in methods:
- **Email/Password**: Username + password hashing
- **Phone Number**: SMS OTP verification
- **Social Providers**: Google, Facebook, GitHub, Apple
- **Custom JWT**: Enterprise identity providers

#### Key Points:

**Password Hashing**: Firebase uses bcrypt with 10 salt rounds minimum. Never store plaintext passwords.

**Session Management**: Tokens expire in 1 hour but can be refreshed indefinitely until logout. Refresh tokens stored on client in `localStorage` or `sessionStorage`.

**Multi-Factor Authentication (MFA)**: Second factor required for sensitive operations:
- 2FA via SMS/authenticator increases account security from ~70% to 99.9%
- Adds 30-60 seconds to login flow
- Required for financial, healthcare, government applications

### Authorization Patterns

**Role-Based Access Control (RBAC)**:
```
User role -> Claims -> Permissions
admin -> ['read', 'write', 'delete'] -> can perform all operations
customer -> ['read'] -> can only view own orders
guest -> [] -> no permissions
```

**Attribute-Based Access Control (ABAC)**:
```
if (user.department == 'finance' AND resource.public == false) {
  deny access
}
```

**Row-Level Security**: Firestore rules engine checks ownership:
```
match /documents/{docId} {
  allow read: if request.auth.uid == resource.data.uid
}
```

This prevents user 123 from reading user 456's documents even with valid token.

## 2. Data Security

### Firestore Database Security

**Collection Structure**:
```
/organizations/{orgId}
  /documents/{docId}
    title: string
    content: string
    ownerId: string (owner can edit)
    sharedWith: array (other users can view)
    created: timestamp
    version: number (audit trail)
```

**Sensitive Data Handling**:
- Never store passwords in Firestore
- Never store API keys in Firestore
- Encrypt PII (SSN, credit card) at application level
- Use `encrypted: true` field for searchable encryption

**Document Size Limits**: Firestore documents limited to 1 MB. Split large documents:
```
Document 1: metadata (title, created, owner)
Document 2: content (split into pages)
Document 3: permissions (who can access)
```

### Cloud Storage Security

**Bucket Structure**:
```
gs://bucket/{userId}/documents/{documentId}/{fileName}
gs://bucket/{userId}/images/{imageId}.jpg
gs://bucket/{userId}/backups/{timestamp}.zip
```

**Access Control**:
- Private bucket: No public access (default)
- Signed URLs: Temporary access (15 minutes) for specific files
- Cloud CDN: Cache public files globally for fast delivery

**File Validation**:
```javascript
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
const MAX_SIZE = 100 * 1024 * 1024; // 100 MB

if (!ALLOWED_TYPES.includes(file.type)) {
  throw new Error('Invalid file type');
}
if (file.size > MAX_SIZE) {
  throw new Error('File too large');
}
```

**Virus Scanning**: Use Cloud Storage trigger to scan uploads:
```javascript
exports.scanUpload = functions.storage.object().onFinalize((object) => {
  // Call ClamAV or VirusTotal API
  const isSafe = await scanFile(object.name);
  if (!isSafe) {
    await bucket.file(object.name).delete();
  }
});
```

## 3. Common Vulnerabilities

### SQL Injection (N/A for Firestore)
Firestore uses structured queries with field names and values separated, preventing injection:
```javascript
// Safe - no injection possible
db.collection('users').where('email', '==', userInput).get()
```

### Cross-Site Scripting (XSS)
**Vulnerable**: Rendering user content in HTML
```javascript
// VULNERABLE
document.getElementById('bio').innerHTML = user.bio; // User inputs <img src=x onerror=alert('xss')>
```

**Secure**: Escape HTML entities
```javascript
// SECURE
document.querySelector('#bio').textContent = user.bio; // Renders as text
```

### Broken Access Control
**Vulnerable**: No permission checks
```javascript
// VULNERABLE
app.get('/api/documents/:id', (req, res) => {
  res.json(db.document(req.params.id)); // Anyone can access any doc
});
```

**Secure**: Verify ownership
```javascript
// SECURE
app.get('/api/documents/:id', verifyToken, (req, res) => {
  const doc = db.document(req.params.id);
  if (doc.ownerId !== req.user.uid) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  res.json(doc);
});
```

### Sensitive Data Exposure
**Vulnerable**: Returning hashed passwords
```javascript
// VULNERABLE
res.json({
  ...user,
  passwordHash: user.passwordHash // Should never return
});
```

**Secure**: Filter sensitive fields
```javascript
// SECURE
const sanitized = {
  id: user.id,
  email: user.email,
  name: user.name
  // passwordHash excluded
};
res.json(sanitized);
```

## 4. Real-World Scenario: Document Collaboration Platform

**Requirements**:
- Users create private documents
- Users can share documents with others
- Shared users can comment but not edit
- Owner can revoke access anytime

**Data Model**:
```javascript
// documents collection
{
  id: 'doc-123',
  title: 'Q1 Planning',
  content: '...',
  ownerId: 'user-456',
  sharedWith: {
    'user-789': { role: 'viewer', grantedAt: 1234567890 },
    'user-999': { role: 'commenter', grantedAt: 1234567890 }
  },
  version: 5,
  created: 1234567890,
  updated: 1234567890
}

// comments subcollection
{
  id: 'comment-001',
  userId: 'user-789',
  text: 'Great ideas here',
  created: 1234567890
}
```

**Firestore Rules**:
```sql
match /documents/{docId} {
  // Owner can do anything
  allow read, write: if request.auth.uid == resource.data.ownerId;
  
  // Shared users can read (if in sharedWith)
  allow read: if request.auth.uid in resource.data.sharedWith;
  
  // Commenters can write comments
  match /comments/{commentId} {
    allow write: if request.auth.uid != null;
    allow read: if parent.data.ownerId == request.auth.uid ||
                   request.auth.uid in parent.data.sharedWith;
  }
}
```

**Revocation Flow**:
```
1. Owner clicks "Revoke {user} access"
2. Backend removes uid from sharedWith array
3. Firestore rule denies future access
4. Cached permissions invalidated
5. User sees "Access revoked" error on next action
```

**Audit Trail**:
```
- Log every read/write with timestamps
- Track who accessed what documents
- Monitor for suspicious patterns (bulk downloads)
- Generate compliance reports
```

## 5. Security Checklist

- [ ] All passwords hashed with bcrypt (10+ rounds)
- [ ] No plaintext secrets in code or database
- [ ] JWT tokens have expiration (1 hour max)
- [ ] Refresh tokens invalidated on logout
- [ ] File uploads validated (type, size, content)
- [ ] Storage bucket blocks public access
- [ ] Firestore RLS rules enforced
- [ ] API endpoints require authentication
- [ ] Sensitive data fields filtered from responses
- [ ] Audit logs capture all sensitive operations
- [ ] Rate limiting prevents brute force
- [ ] CORS whitelist prevents unauthorized domains
- [ ] SSL/TLS enforced for all connections
- [ ] Security headers (HSTS, CSP, X-Frame-Options) present
- [ ] Regular security audits scheduled
- [ ] Incident response plan documented
- [ ] User data export/deletion capability enabled
- [ ] Third-party access controls audit quarterly
