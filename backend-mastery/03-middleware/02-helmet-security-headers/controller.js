// ==================== Security Headers Controllers ====================

/**
 * Get current security headers info
 */
const getSecurityHeaders = (req, res) => {
  res.json({
    message: 'Security Headers Configuration',
    headers: {
      'Content-Security-Policy': 'Defined via helmet CSP directives',
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'X-XSS-Protection': '1; mode=block',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    },
    features: [
      'Protection against clickjacking',
      'MIME type sniffing prevention',
      'XSS protection',
      'Enforced HTTPS',
      'Controlled resource loading',
    ],
  });
};

/**
 * Check if a specific header is set
 */
const checkHeader = (req, res) => {
  const headerName = req.query.header || 'Content-Security-Policy';
  const headerValue = res.getHeader(headerName);
  
  res.json({
    header: headerName,
    value: headerValue || 'Not set',
    present: !!headerValue,
  });
};

/**
 * Demonstrate XSS protection
 */
const xssDemo = (req, res) => {
  const maliciousInput = req.query.input || '<script>alert("XSS")</script>';
  
  res.json({
    warning: 'XSS Attack Attempted',
    input: maliciousInput,
    note: 'This request would be blocked by CSP in browser',
    tips: [
      'Content-Security-Policy prevents inline scripts',
      'X-XSS-Protection header adds browser-level protection',
      'Input should still be sanitized server-side',
      'Use DOMPurify or similar for dynamic content',
    ],
  });
};

/**
 * Demonstrate clickjacking protection
 */
const clickjackingDemo = (req, res) => {
  res.json({
    message: 'Clickjacking Protection Active',
    header: 'X-Frame-Options: DENY',
    means: 'This page cannot be embedded in any frame',
    protection: [
      'Prevents UI redressing attacks',
      'Blocks iframe inclusion from all origins',
      'Alternative: SAMEORIGIN allows same-origin frames',
      'Alternative: ALLOW-FROM restricts to specific domains (deprecated)',
    ],
  });
};

module.exports = {
  getSecurityHeaders,
  checkHeader,
  xssDemo,
  clickjackingDemo,
};
