/**
 * PII Masking & Redaction Utilities
 */

/** Mask email: j***@example.com */
function maskEmail(email) {
  const [local, domain] = email.split("@");
  if (!domain) return "***";
  return local[0] + "***@" + domain;
}

/** Mask phone: show last 4 digits only */
function maskPhone(phone) {
  return phone.replace(/\d(?=\d{4})/g, "*");
}

/** Mask name: show first letter + *** */
function maskName(name) {
  return name.split(" ").map((part) => part[0] + "***").join(" ");
}

/** Mask credit card: **** **** **** 1234 */
function maskCreditCard(number) {
  const digits = number.replace(/\D/g, "");
  return "**** **** **** " + digits.slice(-4);
}

/** Fully redact a value */
function redact(_value) {
  return "[REDACTED]";
}

/** Mask IP: 192.168.*.* */
function maskIP(ip) {
  const parts = ip.split(".");
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.*.*`;
  }
  return "[MASKED_IP]";
}

/** Mask Aadhaar: show last 4 digits */
function maskAadhaar(aadhaar) {
  return "XXXX XXXX " + aadhaar.replace(/\s/g, "").slice(-4);
}

/**
 * Auto-mask an object's PII fields based on field names.
 */
const MASK_MAP = {
  email: maskEmail,
  emailaddress: maskEmail,
  phone: maskPhone,
  phonenumber: maskPhone,
  mobile: maskPhone,
  name: maskName,
  firstname: maskName,
  lastname: maskName,
  fullname: maskName,
  creditcard: maskCreditCard,
  cardnumber: maskCreditCard,
  ipaddress: maskIP,
  ip: maskIP,
  aadhaar: maskAadhaar,
  aadhaarnumber: maskAadhaar,
  ssn: redact,
  pan: redact,
  passport: redact,
  passportnumber: redact,
};

function autoMaskObject(obj) {
  const result = { ...obj };
  for (const key of Object.keys(result)) {
    const norm = key.toLowerCase().replace(/[_-]/g, "");
    const maskFn = MASK_MAP[norm];
    if (maskFn && result[key]) {
      try {
        result[key] = maskFn(String(result[key]));
      } catch {
        result[key] = "[MASKED]";
      }
    }
  }
  return result;
}

module.exports = { maskEmail, maskPhone, maskName, maskCreditCard, maskIP, maskAadhaar, redact, autoMaskObject };
