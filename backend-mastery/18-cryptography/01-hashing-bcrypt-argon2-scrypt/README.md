# Password Hashing: bcrypt, Argon2, Scrypt

## What is this?
This module covers secure password hashing algorithms:
- **bcrypt**: Adaptive password hashing with built-in salt
- **Argon2**: Memory-hard hashing function recommended by OWASP
- **Scrypt**: Key derivation function with configurable cost

## Why does it matter?
- Passwords should NEVER be stored in plain text
- Hashing is one-way: cannot reverse to get original password
- Modern algorithms are slow by design to prevent brute-force attacks
- Salt prevents rainbow table attacks
- Different algorithms offer different security/speed tradeoffs

## How it works (step by step)

### bcrypt
1. Takes a password and a cost factor (rounds)
2. Generates a random salt
3. Applies the Blowfish algorithm multiple times
4. Returns a hash that includes salt and cost information
5. Verification re-hashes and compares results

### Argon2
1. Memory-hard function designed to resist GPU attacks
2. Takes parameters: memory cost, time cost, parallelism
3. Recommended by OWASP for password hashing
4. Slower than bcrypt but more resistant to hardware attacks

### Scrypt
1. Configurable memory and CPU cost
2. Designed by Colin Percival
3. Useful for key derivation
4. Good for password-based encryption

## Key concepts
- **Salt**: Random data added to password before hashing
- **Rounds/Cost**: Number of iterations - higher = more secure but slower
- **Rainbow tables**: Pre-computed hashes of common passwords
- **Timing attacks**: Comparing execution time to guess passwords
- **Adaptive hashing**: Algorithm that becomes harder as computers get faster

## Common mistakes
- Using fast algorithms like MD5/SHA1 for passwords
- Not using salt
- Using weak passwords that are easily guessed
- Storing plain text passwords
- Using same password everywhere
- Not validating password strength

## Real world usage
```javascript
// Registration
const hash = await bcrypt.hash(password, 12);

// Login
const match = await bcrypt.compare(password, hash);
if (match) { /* password correct */ }
```
