// Schema definitions for password hashing

// bcrypt endpoint validation
const bcryptHashValidation = {
  required: ['password'],
  optional: ['rounds'],
  constraints: {
    rounds: 'Default: 12, Range: 4-31',
    password: 'Minimum 6 characters recommended'
  },
  example: {
    password: 'mySecurePassword123',
    rounds: 12
  }
};

// bcrypt verify validation
const bcryptVerifyValidation = {
  required: ['password', 'hash'],
  example: {
    password: 'mySecurePassword123',
    hash: '$2b$12$...'
  }
};

// SHA256 validation
const sha256Validation = {
  required: ['text'],
  example: {
    text: 'hello world'
  }
};

// Password comparison validation
const compareValidation = {
  required: ['text1', 'text2'],
  example: {
    text1: 'password',
    text2: 'passwor'
  }
};

// Algorithm comparison
const algorithmComparison = {
  bcrypt: {
    speed: 'Slow (by design)',
    salt: 'Automatic',
    adaptable: true,
    recommended: 'Passwords'
  },
  argon2: {
    speed: 'Very slow (by design)',
    salt: 'Automatic',
    adaptable: true,
    recommended: 'High-security passwords'
  },
  scrypt: {
    speed: 'Slow',
    salt: 'Manual',
    adaptable: true,
    recommended: 'Key derivation'
  },
  sha256: {
    speed: 'Very fast',
    salt: 'Manual required',
    adaptable: false,
    recommended: 'Checksums, NOT passwords'
  },
  md5: {
    speed: 'Very fast',
    salt: 'Manual required',
    adaptable: false,
    recommended: 'DEPRECATED - do not use'
  }
};

module.exports = {
  bcryptHashValidation,
  bcryptVerifyValidation,
  sha256Validation,
  compareValidation,
  algorithmComparison