// Organization membership middleware
const jwt = require('jsonwebtoken');
const { schema, permissions, roleHierarchy } = require('./schema');

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

const verifyToken = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

const verifyOrgMembership = (req, res, next) => {
  const { orgId } = req.params;
  const userId = req.user.id;
  const member = Object.values(schema.organization_members)
    .find(m => m.organization_id === orgId && m.user_id === userId);
  if (!member) return res.status(403).json({ error: 'Not a member of this org' });
  req.member = member;
  next();
};

const checkPermission = (requiredPermission) => (req, res, next) => {
  const userPerms = permissions[req.member.role] || [];
  if (!userPerms.includes(requiredPermission)) {
    return res.status(403).json({ error: `Requires ${req.member.role}` });
  }
  next();
};

const canManageUser = (req, res, next) => {
  const target = schema.organization_members[req.params.memberId];
  if (!target) return res.status(404).json({ error: 'Member not found' });
  if (roleHierarchy[req.member.role] <= roleHierarchy[target.role]) {
    return res.status(403).json({ error: 'Cannot manage higher role' });
  }
  req.targetMember = target;
  next();
};

module.exports = { verifyToken, verifyOrgMembership, checkPermission, canManageUser };
