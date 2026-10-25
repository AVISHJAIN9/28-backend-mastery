# WebAuthn/Passkeys Authentication

## What is this?

WebAuthn (Web Authentication API) enables passwordless authentication using biometric authentication (fingerprint, face recognition) or security keys. Uses public-key cryptography for secure authentication without passwords.

## Why does it matter?

- Phishing Resistant: Keys bound to domain/origin
- No Passwords: Users don't need strong passwords
- Biometric Integration: Uses device biometrics
- High Security: Cryptographic key pairs (public/private)
- User Experience: Natural, fast authentication
- FIDO2 Compliant: Industry standard for passwordless auth

## How it works (step by step)

1. User clicks "Register" → Server generates challenge
2. User's device creates credential (public/private key pair)
3. Device attests credential creation to server
4. Server stores public key and credential ID
5. On login: Server sends challenge
6. Device signs challenge with private key
7. Server verifies signature matches stored public key
8. User authenticated successfully

## Key concepts

- **Credential ID**: Unique identifier for passkey
- **Public Key**: Stored server-side for verification
- **Private Key**: Secured on device (never leaves)
- **Challenge**: Random nonce preventing replay attacks
- **Attestation**: Proof of credential creation
- **Assertion**: Proof of credential ownership
- **Counter**: Prevents duplicate signature attacks

## Common mistakes

1. Not verifying origin/RP ID properly
2. Ignoring credential counter
3. Not protecting against replay
4. Accepting unatted credentials in production
5. Not using HTTPS
6. Poor recovery options

## Real world usage

- Google Account - passwordless sign-in
- Microsoft Account - Windows Hello integration
- Apple iCloud Keychain - biometric authentication
- GitHub - security key support
- Enterprise SSO - FIDO2 implementation


## Common mistakes

## Real world usage
