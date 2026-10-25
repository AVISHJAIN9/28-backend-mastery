const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

// In-memory stores
const users = new Map([
  ['user1', { id: 'u1', username: 'user1', email: 'user1@example.com', passwordHash: 'hash1' }],
  ['user2', { id: 'u2', username: 'user2', email: 'user2@example.com', passwordHash: 'hash2' }]
]);

const userRiskProfiles = new Map(); // userId -> riskProfile
const loginAttempts = new Map(); // userId -> [{ timestamp, ip, userAgent, success }]
const deviceFingerprints = new Map(); // userId -> [{ fingerprint, firstSeen, lastSeen, trustScore }]

const IP_RISK_DATABASE = new Map([
  ['192.168.1.1', 0], // Trusted IP
  ['10.0.0.1', 0.1],
  ['1.2.3.4', 0.7], // Risky IP
  ['8.8.8.8', 0.3]
]);

const HIGH_RISK_COUNTRIES = new Set(['KP', 'IR', 'SY']); // Example high-risk countries
const GEOIP_DATABASE = new Map([
  ['1.2.3.4', 'RU'],
  ['8.8.8.8', 'US'],
  ['192.168.1.1', 'US']
]);

class RiskBasedAuthController {
  // Evaluate risk score for login attempt
  static async evaluateRisk(req, res) {
    try {
      const { username, ip, userAgent, deviceId } = req.body;
      
      if (!username || !ip) {
        return res.status(400).json({ error: 'username and ip required' });
      }

      const user = users.get(username);
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const riskScore = this.calculateRiskScore(user.id, username, ip, userAgent, deviceId);
      const riskLevel = this.determineRiskLevel(riskScore);
      
      // Store attempt
      if (!loginAttempts.has(user.id)) {
        loginAttempts.set(user.id, []);
      }
      loginAttempts.get(user.id).push({
        timestamp: new Date(),
        ip,
        userAgent,
        success: false,
        riskScore
      });

      res.json({
        riskScore,
        riskLevel,
        requiresMFA: riskLevel === 'high' || riskLevel === 'critical',
        requiresVerification: riskLevel === 'critical',
        factors: this.getRiskFactors(user.id, username, ip, userAgent, deviceId)
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // Calculate composite risk score
  static calculateRiskScore(userId, username, ip, userAgent, deviceId) {
    let score = 0;

    // IP Risk (0.3)
    const ipRisk = this.assessIpRisk(ip);
    score += ipRisk * 0.3;

    // Geolocation Risk (0.25)
    const geoMoment = this.assessGeolocationMoment(userId, ip);
    score += geoMoment * 0.25;

    // Device Risk (0.2)
    const deviceRisk = this.assessDeviceRisk(userId, deviceId, userAgent);
    score += deviceRisk * 0.2;

    // Behavior Anomaly (0.15)
    const behaviorRisk = this.assessBehaviorAnomaly(userId, ip);
    score += behaviorRisk * 0.15;

    // Time-based Risk (0.1)
    const timeRisk = this.assessTimeAnomaly(userId);
    score += timeRisk * 0.1;

    return Math.min(score, 1);
  }

  // IP reputation assessment
  static assessIpRisk(ip) {
    const riskValue = IP_RISK_DATABASE.get(ip);
    if (riskValue !== undefined) {
      return riskValue;
    }
    return 0.5; // Unknown IPs are medium risk
  }

  // Geolocation impossible travel
  static assessGeolocationMoment(userId, currentIp) {
    const attempts = loginAttempts.get(userId);
    if (!attempts || attempts.length === 0) return 0;

    const lastAttempt = attempts[attempts.length - 1];
    const lastCountry = GEOIP_DATABASE.get(lastAttempt.ip);
    const currentCountry = GEOIP_DATABASE.get(currentIp);

    if (!lastCountry || !currentCountry) return 0.2;
    
    if (lastCountry === currentCountry) return 0;
    
    const timeDiffMinutes = (new Date() - lastAttempt.timestamp) / 60000;
    if (timeDiffMinutes < 60) {
      // Impossible travel: different country in less than 1 hour
      return 0.9;
    }

    // High-risk countries
    if (HIGH_RISK_COUNTRIES.has(currentCountry)) {
      return 0.7;
    }

    return 0.3;
  }

  // Device fingerprint assessment
  static assessDeviceRisk(userId, deviceId, userAgent) {
    if (!deviceId) return 0.5; // Unknown device is medium risk

    if (!deviceFingerprints.has(userId)) {
      deviceFingerprints.set(userId, []);
    }

    const devices = deviceFingerprints.get(userId);
    const existingDevice = devices.find(d => d.fingerprint === deviceId);

    if (!existingDevice) {
      // New device: add to list
      devices.push({
        fingerprint: deviceId,
        firstSeen: new Date(),
        lastSeen: new Date(),
        trustScore: 0.3
      });
      return 0.6; // New device is risky
    }

    existingDevice.lastSeen = new Date();
    // Trusted devices have lower risk
    return Math.max(0, 0.5 - existingDevice.trustScore);
  }

  // Behavioral anomaly detection
  static assessBehaviorAnomaly(userId, ip) {
    const attempts = loginAttempts.get(userId);
    if (!attempts || attempts.length < 3) return 0.2;

    // Check failed login frequency
    const recentAttempts = attempts.filter(a => 
      new Date() - a.timestamp < 24 * 60 * 60 * 1000 // Last 24 hours
    );
    
    const failedAttempts = recentAttempts.filter(a => !a.success).length;
    if (failedAttempts > 5) return 0.8; // Many failed attempts

    // Unusual IP pattern
    const ipFreq = {};
    recentAttempts.forEach(a => {
      ipFreq[a.ip] = (ipFreq[a.ip] || 0) + 1;
    });

    const uniqueIps = Object.keys(ipFreq).length;
    if (uniqueIps > 5) return 0.6; // Too many IPs in 24h

    return 0.1;
  }

  // Time-based anomalies
  static assessTimeAnomaly(userId) {
    const attempts = loginAttempts.get(userId);
    if (!attempts || attempts.length === 0) return 0;

    const lastAttempt = attempts[attempts.length - 1];
    const hour = lastAttempt.timestamp.getHours();
    const dayOfWeek = lastAttempt.timestamp.getDay();

    // Unusual time patterns (e.g., 3 AM on Sunday)
    if (hour < 6 || hour > 23) return 0.3; // Odd hours
    if (dayOfWeek === 0 || dayOfWeek === 6) return 0.1; // Weekends

    return 0;
  }

  // Determine risk level
  static determineRiskLevel(score) {
    if (score < 0.2) return 'low';
    if (score < 0.4) return 'medium';
    if (score < 0.7) return 'high';
    return 'critical';
  }

  // Get risk factors breakdown
  static getRiskFactors(userId, username, ip, userAgent, deviceId) {
    return {
      ipRisk: { score: this.assessIpRisk(ip), weight: 0.3 },
      geoRisk: { score: this.assessGeolocationMoment(userId, ip), weight: 0.25 },
      deviceRisk: { score: this.assessDeviceRisk(userId, deviceId, userAgent), weight: 0.2 },
      behaviorRisk: { score: this.assessBehaviorAnomaly(userId, ip), weight: 0.15 },
      timeRisk: { score: this.assessTimeAnomaly(userId), weight: 0.1 }
    };
  }

  // Adaptive authentication flow
  static async authenticate(req, res) {
    try {
      const { username, password, ip, userAgent, deviceId } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ error: 'username and password required' });
      }

      const user = users.get(username);
      if (!user || user.passwordHash !== password) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Calculate risk
      const riskScore = this.calculateRiskScore(user.id, username, ip, userAgent, deviceId);
      const riskLevel = this.determineRiskLevel(riskScore);

      let mfaRequired = false;
      let verificationRequired = false;

      // Adaptive policy
      if (riskLevel === 'high') {
        mfaRequired = true;
      } else if (riskLevel === 'critical') {
        mfaRequired = true;
        verificationRequired = true;
      }

      // Store successful attempt
      if (!loginAttempts.has(user.id)) {
        loginAttempts.set(user.id, []);
      }
      loginAttempts.get(user.id).push({
        timestamp: new Date(),
        ip,
        userAgent,
        success: true,
        riskScore
      });

      if (mfaRequired || verificationRequired) {
        // Return challenge instead of token
        const challengeId = uuidv4();
        return res.json({
          challengeId,
          mfaRequired,
          verificationRequired,
          riskLevel,
          message: 'Additional verification required'
        });
      }

      // Low risk: issue token directly
      const token = jwt.sign(
        { userId: user.id, username },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '1h' }
      );

      res.json({ token, riskLevel, session: uuidv4() });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // Complete adaptive challenge
  static async completeChallenge(req, res) {
    try {
      const { challengeId, username, mfaCode } = req.body;
      
      if (!challengeId || !username) {
        return res.status(400).json({ error: 'challengeId and username required' });
      }

      // In production: verify MFA code, check verification status
      
      const user = users.get(username);
      if (!user) {
        return res.status(401).json({ error: 'Invalid user' });
      }

      const token = jwt.sign(
        { userId: user.id, username },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '1h' }
      );

      res.json({ token, verified: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // Trust device
  static async trustDevice(req, res) {
    try {
      const { userId, deviceId } = req.body;
      
      if (!userId || !deviceId) {
        return res.status(400).json({ error: 'userId and deviceId required' });
      }

      if (!deviceFingerprints.has(userId)) {
        deviceFingerprints.set(userId, []);
      }

      const devices = deviceFingerprints.get(userId);
      const device = devices.find(d => d.fingerprint === deviceId);

      if (device) {
        device.trustScore = Math.min(device.trustScore + 0.2, 0.95);
      }

      res.json({ message: 'Device trusted', trustScore: device?.trustScore });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // Get risk profile
  static async getRiskProfile(req, res) {
    try {
      const { userId } = req.params;
      
      const attempts = loginAttempts.get(userId) || [];
      const devices = deviceFingerprints.get(userId) || [];
      
      const recentAttempts = attempts.slice(-10);
      const avgRiskScore = recentAttempts.length > 0 
        ? recentAttempts.reduce((sum, a) => sum + a.riskScore, 0) / recentAttempts.length
        : 0;

      res.json({
        userId,
        averageRiskScore: avgRiskScore,
        riskLevel: this.determineRiskLevel(avgRiskScore),
        recentAttempts,
        trustedDevices: devices
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
}

module.exports = RiskBasedAuthController;
