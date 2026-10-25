/**
 * PII Classifier
 * Detects and classifies PII fields in objects or strings.
 */

const PII_PATTERNS = {
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/,
  phone: /(\+\d{1,3}[\s.-])?\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}/,
  ssn: /\b\d{3}-\d{2}-\d{4}\b/,
  creditCard: /\b(?:\d[ -]?){13,16}\b/,
  ipv4: /\b(?:\d{1,3}\.){3}\d{1,3}\b/,
  dateOfBirth: /\b(0?[1-9]|[12]\d|3[01])[\/\-](0?[1-9]|1[0-2])[\/\-](\d{4})\b/,
  passport: /\b[A-Z]{1,2}\d{6,9}\b/,
  aadhaar: /\b\d{4}\s\d{4}\s\d{4}\b/,
  pan: /\b[A-Z]{5}\d{4}[A-Z]\b/,
};

const PII_FIELD_NAMES = [
  "name", "firstName", "lastName", "fullName",
  "email", "emailAddress",
  "phone", "phoneNumber", "mobile",
  "address", "streetAddress", "city", "postcode", "zipCode", "pinCode",
  "dateOfBirth", "dob", "birthDate",
  "ssn", "socialSecurityNumber",
  "passport", "passportNumber",
  "aadhaar", "aadhaarNumber",
  "pan", "panNumber",
  "creditCard", "cardNumber",
  "ipAddress", "ip",
  "userId", "customerId",
  "gender", "nationality", "religion", "ethnicity",
  "salary", "income",
  "medicalRecord", "diagnosis", "healthData",
];

/**
 * Scan a flat object for PII field names.
 * Returns array of { field, category, value }
 */
function classifyObjectFields(obj) {
  const findings = [];
  for (const [key, value] of Object.entries(obj)) {
    const normalised = key.toLowerCase().replace(/[_-]/g, "");
    const matched = PII_FIELD_NAMES.find((f) => normalised.includes(f.toLowerCase()));
    if (matched) {
      findings.push({ field: key, category: matched, value: String(value ?? "") });
    }
  }
  return findings;
}

/**
 * Scan a string for PII patterns.
 * Returns array of { type, match }
 */
function scanStringForPII(text) {
  const found = [];
  for (const [type, pattern] of Object.entries(PII_PATTERNS)) {
    const matches = text.match(new RegExp(pattern, "gi")) || [];
    matches.forEach((match) => found.push({ type, match }));
  }
  return found;
}

/**
 * Returns a risk level for a PII category.
 */
function getPIIRiskLevel(category) {
  const HIGH = ["ssn", "creditCard", "passport", "aadhaar", "pan", "healthData", "medicalRecord"];
  const MEDIUM = ["email", "phone", "dateOfBirth", "address"];
  if (HIGH.some((h) => category.toLowerCase().includes(h.toLowerCase()))) return "HIGH";
  if (MEDIUM.some((m) => category.toLowerCase().includes(m.toLowerCase()))) return "MEDIUM";
  return "LOW";
}

module.exports = { classifyObjectFields, scanStringForPII, getPIIRiskLevel, PII_PATTERNS };
