# SMS & OTP Security: Theory & Concepts

## 1. SMS Delivery

### SMS Network Hierarchy
```
Originating operator (your carrier in USA)
  ↓ (route via SMPP protocol)
Gateway operator (Twilio, Nextel, etc.)
  ↓ (route to destination)
Terminating operator (user's carrier in target country)
  ↓
User's phone receives SMS
```

### Delivery Status
- **Submitted**: Message accepted by gateway
- **Queued**: Waiting to deliver
- **Sent**: Delivered to carrier
- **Delivered**: Confirmed device receipt
- **Failed**: Invalid number, carrier reject, etc.

**Use case**: Track OTP delivery, retry if failed

## 2. OTP Security

### Attacks on OTP

**1. Brute Force Attack**
```
OTP is 6 digits (000000 to 999999 = 1M combinations)

Without rate limiting:
- Attacker tries 1000 codes/second
- 1M / 1000 = 1000 seconds → 16 minutes to crack

With rate limiting (3 attempts/minute, 15 min lockout):
- Attacker tries 3 codes → Locked out 15 minutes
- Locked out, can't continue
```

**Protection**: Rate limiting + account lockout

**2. SIM Swapping**
```
Attacker:
1. Calls phone carrier
2. Social engineers support agent
3. Ports phone number to attacker's SIM
4. Receives victim's OTP
5. Accesses account
```

**Protection**: Phone number port-protection flag, 2FA on carrier account

**3. SS7 Interception**
Attackers exploit SS7 protocol weaknesses (old phone network protocol):
```
Attacker gains access to telecom network
  ↓
Intercepts SMS going to victim
  ↓
Receives OTP before victim
  ↓
Logs into victim's account
```

**Protection**: Use authenticator app (TOTP) instead of SMS, backhaul OTP via secured network

## 3. OTP vs TOTP

### SMS-based OTP
Pros:
- Works on any phone (no app installation)
- User familiar with SMS
- No backup codes needed

Cons:
- Carrier dependent (international rates high)
- Slow (SMS can take 1+ minute)
- Vulnerable to SIM swap, SS7

### TOTP (Time-based One-Time Password)
Authenticator apps (Google, Microsoft Authenticator, Authy):
```
1. App generates new 6-digit code every 30 seconds
2. Code based on time + shared secret
3. Server has same secret, generates same code
4. Both codes must match

Example: 12:00:00 → Code 123456
         12:00:30 → Code 654321
         12:01:00 → Code 789012 (code from 12:00:00 expired)
```

Pros:
- Works offline (no network needed)
- Fast (local generation)
- Unaffected by SIM swap, SS7

Cons:
- Requires app installation
- Need backup codes if phone lost
- Not available on feature phones

## 4. Phone Number Validation

### Number Format
```
E.164 format (international standard):
+[country code][number]

Examples:
+14155552671 (USA)
+441632960123 (UK)
+33123456789 (France)
```

### Carrier Lookup
Determine if number is:
- **Fixed line** (landline): Can't receive SMS
- **Mobile**: Can receive SMS
- **VOIP**: Can receive via internet
- **Invalid**: Doesn't exist

## 5. International SMS

### Cost by Region
```
USA/Canada: $0.01 per SMS
UK/Europe: $0.05 per SMS
India/Asia: $0.02 per SMS
Africa: $0.10+ per SMS

Spike: 5M users, each gets 1 OTP = $50,000 bill
```

### Latency by Region
```
Developed countries: < 10 seconds
Emerging markets: 10-60 seconds
Remote areas: > 60 seconds

Best practice: Show countdown timer, allow 2-3 minute window
```

## 6. Security Checklist

- [ ] OTP 6+ digits
- [ ] OTP expires 5-10 minutes
- [ ] Rate limiting: Max 3 attempts/minute
- [ ] Lockout: 15 min after 3 failed attempts
- [ ] SMS not encrypted (use HTTPS wrapper)
- [ ] Phone number validated before sending
- [ ] Delivery status tracked (retry if failed)
- [ ] SMS logs purged after 30 days
- [ ] No OTP in email (email less secure)
- [ ] TOTP as fallback 2FA (for SMS unreliable areas)
- [ ] Backup codes generated for TOTP
- [ ] SIM port protection flag on carrier
- [ ] Audit trail of all OTP attempts
- [ ] Alert if unusual OTP activity (bulk attempts)
