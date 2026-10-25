# Password Hashing Theory

## 1. Hashing Basics

### What is a hash?
- One-way mathematical function
- Takes input of any size, produces fixed-size output
- Same input always produces same output (deterministic)
- Impossible to reverse engineer original input
- Small change in input creates completely different output

### Properties of good hash functions
- **Deterministic**: Same input = same output
- **Quick**: Fast computation
- **Avalanche effect**: Small input change = completely different output
- **Collision resistant**: Hard to find two inputs with same hash
- **One-way**: Cannot reverse to find original input

## 2. bcrypt (Blowfish Crypt)

### How it works
1. Takes password and cost factor (4-31 rounds)
2. Generates random 16-byte salt
3. Applies Blowfish algorithm 2^rounds times
4. Returns hash in format: `$2b$cost$salt$hash`

### Cost and rounds
- Default: 12 rounds = 2^12 = 4096 iterations
- Each additional round doubles the time
- Designed to be elastic: new computers run more iterations in same time

### Example hash
```
$2b$12$R9h/cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss7KIUgO2t0jWMUW
├─ $2b = bcrypt identifier
├─ $12 = cost factor
├─ $R9h/cIPz0gi.URNNX3kh2O = salt
└─ PST9/PgBkqquzi.Ss7KIUgO2t0jWMUW = hash
```

## 3. Argon2

### Why Argon2?
- Winner of Password Hashing Competition (2015)
- Designed to resist GPU and ASIC attacks
- Memory-hard: requires significant RAM
- Time-hard: requires significant CPU time

### Parameters
- **Memory cost**: Amount of RAM required (KB)
- **Time cost**: Number of iterations
- **Parallelism**: Number of parallel threads
- **Salt**: Random data (usually 16 bytes)

### Variants
- **Argon2i**: Optimized for side-channel resistance
- **Argon2d**: Optimized for faster hashing
- **Argon2id**: Hybrid, recommended for passwords

## 4. Scrypt

### Design principles
- CPU-bound and memory-bound
- Parameters are configurable
- Useful for key derivation

### Parameters (RFC 7914)
- **N**: CPU/memory cost (must be power of 2)
- **r**: Block size
- **p**: Parallelization parameter
- Typical: N=16384, r=8, p=1

## 5. Other Algorithms (NOT recommended for passwords)

### SHA256, MD5
- Fast (milliseconds)
- No built-in salt
- Parallelizable (bad for passwords)
- Vulnerable to rainbow tables
- Suitable for: checksums, file integrity
- **NOT suitable for passwords**

## 6. Rainbow Tables & Salt

### Rainbow Table Attack
- Pre-computed table of hash values
- For common passwords + hashes
- Can look up password if you have hash

### Salt Protection
- Random data added to password before hashing
- Each password gets unique salt
- Same password hashes differently every time
- Makes rainbow tables impractical

## 7. Algorithm Comparison

| Feature | bcrypt | Argon2 | Scrypt | SHA256 |
|---------|--------|--------|--------|--------|
| Speed | Slow | Very Slow | Slow | Very Fast |
| Memory | Minimal | High | Medium | None |
| Salt | Auto | Auto | Manual | Manual |
| Adaptable | Yes | Yes | Yes | No |
| GPU Resistant | Good | Excellent | Good | Poor |
| OWASP Recommend | Yes | Yes | Yes | No |
| For Passwords | ✓ | ✓ | ✓ | ✗ |

## 8. Best Practices

### For password hashing
1. Use bcrypt, Argon2, or scrypt
2. Use appropriate cost/memory settings
3. Never use MD5, SHA1, or plain SHA256
4. Use automatic salt generation
5. Hash during registration
6. Compare during login using constant-time comparison

### For users
1. Use strong, unique passwords
2. Use password managers
3. Enable two-factor authentication
4. Never reuse passwords across services
5. Change passwords if breach suspected
