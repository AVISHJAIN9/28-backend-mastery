# Step-Up Pattern

Sensitive operations flow:

1. User requests operation (change_password)
2. Server initiates step-up challenge
3. User re-enters credentials
4. Server verifies and issues step-up token
5. User includes step-up token in sensitive request
6. Server performs operation
7. Log operation for audit trail

Usage in microservices: Internal services can trust step-up tokens for operation authorization.
