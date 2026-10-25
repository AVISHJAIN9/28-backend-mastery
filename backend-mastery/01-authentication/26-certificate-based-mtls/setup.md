# mTLS Setup Guide

## Prerequisites

- Node.js >= 14
- OpenSSL (for certificate generation)
- npm or yarn
- Basic understanding of TLS/SSL

## Step 1: Install Dependencies

```bash
cd 26-certificate-based-mtls

npm install express https crypto joi uuid cors dotenv morgan
```

## Step 2: Generate Certificates

### Create Certificate Directory
```bash
mkdir -p certs
cd certs
```

### Generate CA (Certificate Authority)

```bash
# Generate CA private key
openssl genrsa -out ca-key.pem 2048

# Generate CA certificate (self-signed, valid for 10 years)
openssl req -new -x509 -days 3650 -key ca-key.pem -out ca-cert.pem \
  -subj "/C=US/ST=California/L=San Francisco/O=ACME Corp/OU=Engineering/CN=ACME-CA"
```

### Generate Server Certificates

```bash
# Generate server private key
openssl genrsa -out server-key.pem 2048

# Generate server certificate signing request
openssl req -new -key server-key.pem -out server.csr \
  -subj "/C=US/ST=California/L=San Francisco/O=ACME Corp/OU=Backend/CN=localhost"

# Sign server certificate with CA
openssl x509 -req -days 365 -in server.csr \
  -CA ca-cert.pem -CAkey ca-key.pem -CAcreateserial \
  -out server-cert.pem \
  -addext "subjectAltName=DNS:localhost,DNS:127.0.0.1"

# Remove server CSR
rm server.csr
```

### Generate Client Certificates

```bash
# Generate client private key
openssl genrsa -out client-key.pem 2048

# Generate client certificate signing request
openssl req -new -key client-key.pem -out client.csr \
  -subj "/C=US/ST=California/L=San Francisco/O=ACME Corp/OU=Frontend/CN=api-client-01"

# Sign client certificate with CA
openssl x509 -req -days 365 -in client.csr \
  -CA ca-cert.pem -CAkey ca-key.pem -CAcreateserial \
  -out client-cert.pem

# Remove client CSR
rm client.csr
```

### Verify Certificates

```bash
# Check CA certificate
openssl x509 -in ca-cert.pem -text -noout

# Check server certificate
openssl x509 -in server-cert.pem -text -noout

# Check client certificate
openssl x509 -in client-cert.pem -text -noout

# Verify certificate chain
openssl verify -CAfile ca-cert.pem server-cert.pem
openssl verify -CAfile ca-cert.pem client-cert.pem
```

## Step 3: Create Server File

**server.js**
```javascript
const https = require('https');
const fs = require('fs');
const express = require('express');
require('dotenv').config();

const app = express();
const mtlsRoutes = require('./routes');

app.use(express.json());
app.use('/mtls', mtlsRoutes);

// mTLS Configuration
const options = {
  key: fs.readFileSync('./certs/server-key.pem'),
  cert: fs.readFileSync('./certs/server-cert.pem'),
  ca: fs.readFileSync('./certs/ca-cert.pem'),
  requestCert: true,           // Request client certificate
  rejectUnauthorized: false    // Set to true in production
};

const port = process.env.PORT || 3443;

https.createServer(options, app).listen(port, () => {
  console.log(`✅ mTLS Server running on https://localhost:${port}`);
  console.log('   Requires client certificates for authentication');
});
```

## Step 4: Set Environment Variables

Create `.env` file:
```bash
cp .env.example .env
```

Update values:
```
PORT=3443
NODE_ENV=development
TLS_KEY_PATH=./certs/server-key.pem
TLS_CERT_PATH=./certs/server-cert.pem
CLIENT_CA_PATH=./certs/ca-cert.pem
```

## Step 5: Start Server

```bash
node server.js
```

Output:
```
✅ mTLS Server running on https://localhost:3443
   Requires client certificates for authentication
```

## API Testing

### Using curl with certificates

#### Register Certificate
```bash
curl --cert ./certs/client-cert.pem \
     --key ./certs/client-key.pem \
     --cacert ./certs/server-cert.pem \
     -X POST https://localhost:3443/mtls/register \
     -H "Content-Type: application/json" \
     -d '{
       "clientName": "api-client-01",
       "organizationUnit": "Engineering/Backend",
       "email": "backend@acme.com"
     }'
```

#### Get Session Token
```bash
curl --cert ./certs/client-cert.pem \
     --key ./certs/client-key.pem \
     --cacert ./certs/server-cert.pem \
     -X POST https://localhost:3443/mtls/authenticate
```

Response:
```json
{
  "message": "Client certificate authenticated successfully",
  "clientId": "uuid-123",
  "sessionToken": "abc123...",
  "expiresIn": 86400
}
```

#### Use Session Token
```bash
curl -H "x-session-token: abc123..." \
     -X GET https://localhost:3443/mtls/client-info
```

#### List Certificates
```bash
curl --cert ./certs/client-cert.pem \
     --key ./certs/client-key.pem \
     --cacert ./certs/server-cert.pem \
     -X GET https://localhost:3443/mtls/list
```

#### Validate Certificate Chain
```bash
curl --cert ./certs/client-cert.pem \
     --key ./certs/client-key.pem \
     --cacert ./certs/server-cert.pem \
     -X POST https://localhost:3443/mtls/validate-chain
```

### Using Node.js Client

```javascript
const https = require('https');
const fs = require('fs');

const options = {
  hostname: 'localhost',
  port: 3443,
  path: '/mtls/authenticate',
  method: 'POST',
  key: fs.readFileSync('./certs/client-key.pem'),
  cert: fs.readFileSync('./certs/client-cert.pem'),
  ca: fs.readFileSync('./certs/server-cert.pem'),
  rejectUnauthorized: false
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('Response:', JSON.parse(data));
  });
});

req.on('error', (err) => console.error('Error:', err));
req.end();
```

## Production Deployment

### Key Considerations

1. **Certificate Generation**
   - Use internal PKI or HashiCorp Vault
   - Never commit private keys to version control

2. **Certificate Rotation**
   - Implement automated rotation
   - Monitor expiration dates
   - Use cert-manager in Kubernetes

3. **Security**
   - `rejectUnauthorized: true` in production
   - Use strong key algorithms (RSA 2048+)
   - Implement certificate pinning
   - Enable audit logging

4. **Monitoring**
   - Alert on certificate expiration
   - Track failed auth attempts
   - Monitor revocation status

## Troubleshooting

### Certificate Verification Failed
```
Error: unable to verify the first certificate
```
Solution: Ensure CA certificate is included:
```bash
curl --cacert ./certs/ca-cert.pem ...
```

### EPROTO or SSL handshake failure
```
Error: SSL_ERROR_SSLV3_ALERT_UNKNOWN_CA
```
Solution: Verify server certificate is signed by CA certificate

### Permission Denied
```
Error: EACCES: permission denied, open './certs/client-key.pem'
```
Solution: Set proper permissions:
```bash
chmod 400 ./certs/*-key.pem
```

## Next Steps

- Store certificates in secrets management (Vault, K8s Secrets)
- Implement certificate rotation automation
- Add audit logging for all certificate operations
- Set up monitoring for certificate expiration
- Test revocation scenarios
