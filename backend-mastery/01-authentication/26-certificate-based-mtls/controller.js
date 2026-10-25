const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

// In-memory stores
const certificateRegistry = new Map(); // Store certificate metadata
const authorizedClients = new Map(); // Map of certificate thumbprints to client info
const sessionTokens = new Map(); // Store session tokens from certificate auth

/**
 * Extract certificate thumbprint (fingerprint)
 * @param {Object} cert - Certificate object
 * @returns {string} SHA256 thumbprint
 */
const getCertificateThumbprint = (cert) => {
  return crypto
    .createHash('sha256')
    .update(cert.raw)
    .digest('hex');
};

/**
 * Extract certificate details
 * @param {Object} cert - Certificate object
 * @returns {Object} Certificate metadata
 */
const extractCertificateDetails = (cert) => {
  return {
    subject: cert.subject,
    issuer: cert.issuer,
    valid_from: cert.valid_from,
    valid_to: cert.valid_to,
    fingerprint: cert.fingerprint,
    serialNumber: cert.serialNumber,
    thumbprint: getCertificateThumbprint(cert)
  };
};

/**
 * Register a client certificate
 * Certificate-based authentication start: Client provides certificate
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
exports.registerClientCertificate = async (req, res) => {
  try {
    const { clientName, organizationUnit, email, metadata } = req.body;

    // Get client certificate from request
    const cert = req.socket.getPeerCertificate();
    
    if (!cert || Object.keys(cert).length === 0) {
      return res.status(400).json({ 
        error: 'No client certificate provided. Use mTLS connection.' 
      });
    }

    // Verify certificate is valid
    if (req.socket.authorizationError) {
      return res.status(403).json({ 
        error: 'Certificate validation failed',
        details: req.socket.authorizationError 
      });
    }

    const thumbprint = getCertificateThumbprint(cert);

    // Check if certificate already registered
    if (authorizedClients.has(thumbprint)) {
      return res.status(409).json({ 
        error: 'This certificate is already registered' 
      });
    }

    const certDetails = extractCertificateDetails(cert);

    // Register the certificate
    const clientId = uuidv4();
    const clientInfo = {
      id: clientId,
      clientName,
      organizationUnit,
      email,
      certificate: certDetails,
      thumbprint,
      metadata: metadata || {},
      registeredAt: new Date(),
      status: 'active',
      lastUsed: null
    };

    authorizedClients.set(thumbprint, clientInfo);

    return res.status(201).json({
      message: 'Client certificate registered successfully',
      clientId,
      thumbprint,
      certificateInfo: certDetails
    });
  } catch (error) {
    console.error('Certificate registration error:', error);
    return res.status(500).json({ error: 'Certificate registration failed' });
  }
};

/**
 * Authenticate using client certificate
 * This happens automatically when client connects with valid cert
 * Creates a session token for subsequent API calls
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
exports.authenticateCertificate = async (req, res) => {
  try {
    const cert = req.socket.getPeerCertificate();

    if (!cert || Object.keys(cert).length === 0) {
      return res.status(401).json({ 
        error: 'No client certificate provided' 
      });
    }

    if (req.socket.authorizationError) {
      return res.status(403).json({ 
        error: 'Certificate validation failed',
        details: req.socket.authorizationError 
      });
    }

    const thumbprint = getCertificateThumbprint(cert);

    // Check if certificate is authorized
    if (!authorizedClients.has(thumbprint)) {
      return res.status(403).json({ 
        error: 'Certificate not registered. Register certificate first.' 
      });
    }

    const clientInfo = authorizedClients.get(thumbprint);

    // Check if certificate is still valid
    const validTo = new Date(clientInfo.certificate.valid_to);
    if (validTo < new Date()) {
      return res.status(403).json({ 
        error: 'Certificate has expired' 
      });
    }

    // Create session token
    const sessionToken = crypto.randomBytes(32).toString('hex');
    sessionTokens.set(sessionToken, {
      clientId: clientInfo.id,
      thumbprint,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    });

    // Update last used timestamp
    clientInfo.lastUsed = new Date();

    return res.status(200).json({
      message: 'Client certificate authenticated successfully',
      clientId: clientInfo.id,
      clientName: clientInfo.clientName,
      sessionToken,
      expiresIn: 86400, // 24 hours in seconds
      certificateInfo: {
        subject: clientInfo.certificate.subject,
        issuer: clientInfo.certificate.issuer,
        validTo: clientInfo.certificate.valid_to
      }
    });
  } catch (error) {
    console.error('Certificate authentication error:', error);
    return res.status(500).json({ error: 'Authentication failed' });
  }
};

/**
 * Verify session token (for subsequent API calls)
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
exports.verifySessionToken = async (req, res) => {
  try {
    const token = req.headers['x-session-token'];

    if (!token) {
      return res.status(401).json({ 
        error: 'Session token required' 
      });
    }

    if (!sessionTokens.has(token)) {
      return res.status(401).json({ 
        error: 'Invalid or expired session token' 
      });
    }

    const session = sessionTokens.get(token);

    // Check if token expired
    if (session.expiresAt < new Date()) {
      sessionTokens.delete(token);
      return res.status(401).json({ 
        error: 'Session token has expired' 
      });
    }

    const clientInfo = authorizedClients.get(session.thumbprint);

    return res.status(200).json({
      message: 'Session token is valid',
      clientId: clientInfo.id,
      clientName: clientInfo.clientName,
      expiresAt: session.expiresAt
    });
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(500).json({ error: 'Verification failed' });
  }
};

/**
 * Get current authenticated client info
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
exports.getClientInfo = async (req, res) => {
  try {
    const thumbprint = req.clientThumbprint;

    if (!thumbprint) {
      return res.status(401).json({ 
        error: 'Unauthenticated' 
      });
    }

    const clientInfo = authorizedClients.get(thumbprint);

    if (!clientInfo) {
      return res.status(404).json({ 
        error: 'Client not found' 
      });
    }

    return res.status(200).json({
      clientId: clientInfo.id,
      clientName: clientInfo.clientName,
      organizationUnit: clientInfo.organizationUnit,
      email: clientInfo.email,
      status: clientInfo.status,
      registeredAt: clientInfo.registeredAt,
      lastUsed: clientInfo.lastUsed,
      certificate: {
        subject: clientInfo.certificate.subject,
        issuer: clientInfo.certificate.issuer,
        validFrom: clientInfo.certificate.valid_from,
        validTo: clientInfo.certificate.valid_to,
        thumbprint: clientInfo.certificate.thumbprint
      },
      metadata: clientInfo.metadata
    });
  } catch (error) {
    console.error('Error fetching client info:', error);
    return res.status(500).json({ error: 'Failed to fetch client info' });
  }
};

/**
 * Revoke a client certificate
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
exports.revokeCertificate = async (req, res) => {
  try {
    const { thumbprint } = req.body;

    if (!thumbprint) {
      return res.status(400).json({ 
        error: 'Thumbprint required' 
      });
    }

    if (!authorizedClients.has(thumbprint)) {
      return res.status(404).json({ 
        error: 'Certificate not found' 
      });
    }

    const clientInfo = authorizedClients.get(thumbprint);
    clientInfo.status = 'revoked';

    // Clean up associated session tokens
    for (const [token, session] of sessionTokens.entries()) {
      if (session.thumbprint === thumbprint) {
        sessionTokens.delete(token);
      }
    }

    return res.status(200).json({
      message: 'Certificate revoked successfully',
      clientId: clientInfo.id,
      thumbprint
    });
  } catch (error) {
    console.error('Revocation error:', error);
    return res.status(500).json({ error: 'Revocation failed' });
  }
};

/**
 * List all registered certificates
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
exports.listCertificates = async (req, res) => {
  try {
    const certificates = Array.from(authorizedClients.values()).map(client => ({
      clientId: client.id,
      clientName: client.clientName,
      organizationUnit: client.organizationUnit,
      status: client.status,
      registeredAt: client.registeredAt,
      lastUsed: client.lastUsed,
      thumbprint: client.thumbprint,
      validTo: client.certificate.valid_to
    }));

    return res.status(200).json({
      total: certificates.length,
      certificates
    });
  } catch (error) {
    console.error('Error listing certificates:', error);
    return res.status(500).json({ error: 'Failed to list certificates' });
  }
};

/**
 * Validate certificate chain
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
exports.validateCertificateChain = async (req, res) => {
  try {
    const cert = req.socket.getPeerCertificate(true);

    if (!cert) {
      return res.status(400).json({ 
        error: 'No certificate provided' 
      });
    }

    const isValid = req.socket.authorized;
    const chain = [];
    let current = cert;

    // Build certificate chain
    while (current) {
      chain.push({
        subject: current.subject,
        issuer: current.issuer,
        fingerprint: current.fingerprint,
        valid_from: current.valid_from,
        valid_to: current.valid_to
      });
      current = current.issuerCertificate;
    }

    return res.status(200).json({
      valid: isValid,
      authorizationError: req.socket.authorizationError || null,
      chain
    });
  } catch (error) {
    console.error('Certificate validation error:', error);
    return res.status(500).json({ error: 'Validation failed' });
  }
};
