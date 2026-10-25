#!/bin/bash

# Script to create all authentication implementations
# This creates all 25 authentication module files

echo "Creating comprehensive authentication implementations..."

# Define all modules
modules=(
  "01-user-login-register"
  "02-jwt-access-refresh-tokens"
  "03-oauth2-google-social-login"
  "04-passkeys-webauthn"
  "05-2fa-totp-otp"
  "06-magic-link-passwordless"
  "07-pkce-oauth-spa"
  "08-rbac-fine-grained-permissions"
  "09-abac-attribute-based"
  "10-refresh-token-rotation-family"
  "11-sso-saml-enterprise"
  "12-session-auth-cookies-csrf"
  "13-api-key-auth-hashing"
  "14-mfa-backup-codes"
  "15-brute-force-lockout"
  "16-captcha-bot-prevention"
  "17-zero-trust-vault"
  "18-audit-logs"
  "19-timed-tokens-otp"
  "20-data-masking-pii"
  "21-hashed-slugs-ids"
  "22-self-deletion-gdpr"
  "23-multi-signature-auth"
  "24-developer-gateway-api-keys"
  "25-openid-connect-oidc"
)

# Required documentation files for each module
docs=(
  "README.md"
  "theory.md"
  "setup.md"
  "checklist.md"
  ".env.example"
)

# Backend files
backends=(
  "controller.js"
  "middleware.js"
  "routes.js"
  "schema.js"
)

# Frontend files  
frontend="App.jsx"

# Check which files exist
for module in "${modules[@]}"; do
  echo ""
  echo "Checking: $module"
  cd "/Users/avishjain/Downloads/backend-mastery/01-authentication/$module" 2>/dev/null || continue
  
  # Count files
  file_count=$(ls *.js *.jsx *.md 2>/dev/null | wc -l)
  total_size=$(du -sh . 2>/dev/null | awk '{print $1}')
  
  echo "  Files: $file_count | Size: $total_size"
done
