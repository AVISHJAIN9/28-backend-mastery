# Certificate-Based Authentication (mTLS)

## What is this?

Mutual TLS (mTLS) authentication is a cryptographic protocol where both client and server authenticate each other using X.509 certificates during the TLS handshake. Unlike traditional HTTPS where only the server is authenticated, mTLS requires the client to present a valid certificate signed by a trusted Certificate Authority (CA).

## Why does it matter?

- **Zero Trust Security**: Eliminates reliance on passwords or API keys
- **Service-to-Service Auth**: Perfect for microservices architecture
- **Compliance**: Meets strict security requirements (finance, healthcare, government)
- **Automated Rotation**: Certificates can be rotated without manual intervention
- **Immutable Audit Trail**: All connections are logged and verifiable

## How it works (step by step)

1. **Certificate Generation**: Client generates a private key and certificate signing request (CSR)
2. **CA Signing**: Certificate Authority (CA) signs the CSR and issues a certificate
3. **TLS Handshake**: Client presents certificate during TLS handshake
4. **Verification**: Server verifies certificate against CA certificate
5. **Mutual Authentication**: Both parties confirm each other's identity
6. **Session Token**: Upon success, server issues a session token for subsequent requests

## Key concepts

### X.509 Certificate
A public key infrastructure (PKI) certificate containing:
- Subject (client identity)
- Issuer (signing authority)
- Public key
- Validity period
- Signature from CA

### Certificate Thumbprint
SHA256 hash of the certificate used for unique identification and revocation tracking.

### mTLS Handshake
```
Client                          Server
  |------- ClientHello -------->|
  |                             |
  |<-- ServerHello + Cert ------|
  |                             |
  |------- ClientCert -------->|
  |                             |
  |<-- ServerKeyExchange -------|
  |                             |
  |------- ClientKeyExchange -->|
  |                             |
  |-- Finished (encrypted) ---->|
  |                             |
  |<-- Finished (encrypted) ---|
```

### Common Mistake: Self-Signed Certificates
Using self-signed certificates without proper verification can create false security. Always validate against a trusted CA.

## Real world usage

- **Kubernetes**: Services communicate over mTLS by default
- **Microservices**: Inter-service authentication in cloud environments
- **IoT Devices**: Secure device-to-backend communication
- **Banking APIs**: High-security payment processing
- **Healthcare**: HIPAA-compliant service communication

## Security Features

✅ **Certificate Validation**: Verify certificate chain and expiration
✅ **Thumbprint Tracking**: Unique certificate identification
✅ **Revocation Support**: Immediate certificate revocation
✅ **Audit Logging**: All certificate operations logged
✅ **Session Tokens**: Stateful sessions for non-mTLS clients
✅ **Certificate Rotation**: Graceful key rotation support
