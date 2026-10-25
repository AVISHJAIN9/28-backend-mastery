// Organization members and invites controller
const { schema, permissions, roleHierarchy } = require('./schema');

class OrganizationController {
  getUserOrganizations(userId) {
    const members = Object.values(schema.organization_members)
      .filter(m => m.user_id === userId);
    return members.map(m => ({ ...schema.organizations[m.organization_id], role: m.role, joined_at: m.joined_at }));
  }

  getOrganizationMembers(orgId) {
    const members = Object.values(schema.organization_members).filter(m => m.organization_id === orgId);
    return members.map(m => ({ ...m, user: schema.users[m.user_id], permissions: permissions[m.role] }));
  }

  getOrganizationInvites(orgId) {
    return Object.values(schema.organization_invites)
      .filter(i => i.organization_id === orgId && !i.accepted_at);
  }

  inviteUser(orgId, email, role, invitedById) {
    const inviteId = `invite-${Date.now()}`;
    const token = `invite_token_${Date.now()}`;
    const newInvite = {
      id: inviteId, organization_id: orgId, email, role, invited_by_id: invitedById,
      created_at: new Date(), expires_at: new Date(Date.now() + 30*24*60*60*1000), token, accepted_at: null
    };
    schema.organization_invites[inviteId] = newInvite;
    return newInvite;
  }

  acceptInvite(inviteId) {
    const invite = schema.organization_invites[inviteId];
    if (!invite || invite.accepted_at || new Date() > new Date(invite.expires_at)) 
      throw new Error('Invite invalid or expired');
    
    const existingUser = Object.values(schema.users).find(u => u.email === invite.email);
    const userId = existingUser ? existingUser.id : `user-${Date.now()}`;
    
    if (!existingUser) {
      schema.users[userId] = { id: userId, email: invite.email, name: invite.email.split('@')[0], password: null, created_at: new Date() };
    }
    
    const memberId = `member-${Date.now()}`;
    schema.organization_members[memberId] = {
      id: memberId, organization_id: invite.organization_id, user_id: userId, 
      role: invite.role, joined_at: new Date(), invited_by_id: invite.invited_by_id
    };
    
    schema.organization_invites[inviteId].accepted_at = new Date();
    return { member: schema.organization_members[memberId], user: schema.users[userId] };
  }

  removeMember(orgId, memberId) {
    const member = schema.organization_members[memberId];
    if (!member || member.organization_id !== orgId) throw new Error('Member not found');
    if (member.role === 'owner') throw new Error('Cannot remove owner');
    delete schema.organization_members[memberId];
    return { success: true };
  }

  updateMemberRole(orgId, memberId, newRole) {
    const member = schema.organization_members[memberId];
    if (!member || member.organization_id !== orgId) throw new Error('Member not found');
    if (member.role === 'owner') throw new Error('Cannot change owner');
    if (!['viewer', 'member', 'admin'].includes(newRole)) throw new Error('Invalid role');
    member.role = newRole;
    return member;
  }

  getMember(memberId) {
    const member = schema.organization_members[memberId];
    return member ? { ...member, user: schema.users[member.user_id], permissions: permissions[member.role] } : null;
  }
}

module.exports = OrganizationController;
