// Organization member routes
const express = require('express');
const router = express.Router();
const OrganizationController = require('./controller');
const { verifyToken, verifyOrgMembership, checkPermission, canManageUser } = require('./middleware');

const controller = new OrganizationController();

router.get('/users/:userId/organizations', verifyToken, (req, res) => {
  try {
    const orgs = controller.getUserOrganizations(req.params.userId);
    res.json(orgs);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/organizations/:orgId/members', verifyToken, verifyOrgMembership, (req, res) => {
  try {
    const members = controller.getOrganizationMembers(req.params.orgId);
    res.json(members);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/organizations/:orgId/invites', verifyToken, verifyOrgMembership, checkPermission('manage_members'), (req, res) => {
  try {
    const invites = controller.getOrganizationInvites(req.params.orgId);
    res.json(invites);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/organizations/:orgId/invites', verifyToken, verifyOrgMembership, checkPermission('invite_users'), (req, res) => {
  try {
    const { email, role } = req.body;
    if (!email || !role) return res.status(400).json({ error: 'Email and role required' });
    const invite = controller.inviteUser(req.params.orgId, email, role, req.user.id);
    res.status(201).json(invite);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/invites/:inviteId/accept/:token', (req, res) => {
  try {
    const result = controller.acceptInvite(req.params.inviteId);
    res.json({ success: true, message: 'Invite accepted', member: result.member, user: result.user });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/organizations/:orgId/members/:memberId', verifyToken, verifyOrgMembership, checkPermission('manage_members'), canManageUser, (req, res) => {
  try {
    controller.removeMember(req.params.orgId, req.params.memberId);
    res.json({ success: true, message: 'Member removed' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.patch('/organizations/:orgId/members/:memberId', verifyToken, verifyOrgMembership, checkPermission('manage_members'), canManageUser, (req, res) => {
  try {
    const { role } = req.body;
    if (!role) return res.status(400).json({ error: 'Role required' });
    const updated = controller.updateMemberRole(req.params.orgId, req.params.memberId, role);
    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/members/:memberId', verifyToken, (req, res) => {
  try {
    const member = controller.getMember(req.params.memberId);
    if (!member) return res.status(404).json({ error: 'Member not found' });
    res.json(member);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Organization members API working' });
});

module.exports = router;
