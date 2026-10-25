import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

// Simulated KDC (Key Distribution Center) and user database
const users = new Map();
const kerberosSessions = new Map();
const serviceTickets = new Map();

/**
 * Step 1: Request TGT (Ticket Granting Ticket) from KDC
 * Client sends username, and KDC returns TGT encrypted with user's password hash
 */
export const requestTGT = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Lookup user in Kerberos database
    let user = Array.from(users.values()).find(u => u.username === username);
    
    if (!user) {
      // Auto-create for demo
      user = {
        id: uuidv4(),
        username,
        passwordHash: Buffer.from(password).toString('base64'),
        realm: 'EXAMPLE.COM',
        createdAt: new Date()
      };
      users.set(username, user);
    }

    // Verify password
    if (Buffer.from(password).toString('base64') !== user.passwordHash) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Create TGT (Ticket Granting Ticket)
    const tgt = jwt.sign(
      { userId: user.id, username, realm: user.realm, type: 'TGT' },
      process.env.KERBEROS_SECRET || 'kerberos-secret',
      { expiresIn: '8h' }
    );

    const sessionId = uuidv4();
    kerberosSessions.set(sessionId, {
      userId: user.id,
      username,
      realm: user.realm,
      tgt,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000)
    });

    res.json({
      message: 'TGT issued',
      sessionId,
      tgt,
      user: { id: user.id, username, realm: user.realm }
    });
  } catch (error) {
    console.error('TGT request error:', error);
    res.status(500).json({ error: 'TGT request failed' });
  }
};

/**
 * Step 2: Request Service Ticket using TGT
 * Client presents TGT to get a service-specific ticket
 */
export const requestServiceTicket = async (req, res) => {
  try {
    const { sessionId, serviceName } = req.body;

    const session = kerberosSessions.get(sessionId);
    if (!session || new Date() > session.expiresAt) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

    // Verify TGT is valid
    try {
      jwt.verify(session.tgt, process.env.KERBEROS_SECRET || 'kerberos-secret');
    } catch (e) {
      return res.status(401).json({ error: 'Invalid TGT' });
    }

    // Create service ticket
    const serviceTicket = jwt.sign(
      {
        userId: session.userId,
        username: session.username,
        realm: session.realm,
        serviceName,
        type: 'SERVICE'
      },
      process.env.KERBEROS_SECRET || 'kerberos-secret',
      { expiresIn: '30m' }
    );

    const ticketId = uuidv4();
    serviceTickets.set(ticketId, {
      userId: session.userId,
      username: session.username,
      serviceName,
      ticket: serviceTicket,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000)
    });

    res.json({
      message: 'Service ticket issued',
      ticketId,
      serviceTicket,
      serviceName
    });
  } catch (error) {
    console.error('Service ticket request error:', error);
    res.status(500).json({ error: 'Service ticket request failed' });
  }
};

/**
 * Step 3: Authenticate with Service using Service Ticket
 */
export const authenticateWithService = async (req, res) => {
  try {
    const { ticketId, serviceName } = req.body;

    const ticket = serviceTickets.get(ticketId);
    if (!ticket || new Date() > ticket.expiresAt) {
      return res.status(401).json({ error: 'Invalid or expired service ticket' });
    }

    if (ticket.serviceName !== serviceName) {
      return res.status(403).json({ error: 'Service mismatch' });
    }

    // Verify ticket signature
    try {
      jwt.verify(ticket.ticket, process.env.KERBEROS_SECRET || 'kerberos-secret');
    } catch (e) {
      return res.status(401).json({ error: 'Invalid ticket' });
    }

    // Create final access token
    const accessToken = jwt.sign(
      {
        userId: ticket.userId,
        username: ticket.username,
        realm: ticket.realm,
        authenticatedAt: new Date(),
        type: 'ACCESS'
      },
      process.env.JWT_SECRET || 'jwt-secret',
      { expiresIn: '15m' }
    );

    const user = users.get(ticket.username);
    
    res.json({
      message: 'Service authentication successful',
      accessToken,
      user: { id: user.id, username: user.username, realm: user.realm }
    });
  } catch (error) {
    console.error('Service authentication error:', error);
    res.status(500).json({ error: 'Service authentication failed' });
  }
};

/**
 * Get current session info
 */
export const getSessionInfo = (req, res) => {
  try {
    const session = kerberosSessions.get(req.params.sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({
      sessionId: req.params.sessionId,
      username: session.username,
      realm: session.realm,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
      isValid: new Date() <= session.expiresAt
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get session info' });
  }
};

/**
 * Logout - invalidate session
 */
export const logout = (req, res) => {
  try {
    const { sessionId } = req.body;
    kerberosSessions.delete(sessionId);
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Logout failed' });
  }
};
