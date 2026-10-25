import React, { useState } from 'react';

const API_BASE = 'http://localhost:4002';

export default function OrgMembersApp() {
  const [token, setToken] = useState(null);
  const [orgId, setOrgId] = useState('org-1');
  const [members, setMembers] = useState([]);
  const [response, setResponse] = useState(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');

  const login = async (userId) => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      const data = await res.json();
      setToken(data.token);
      setResponse({ success: true, message: `Logged in as ${data.user.name}` });
    } catch (e) {
      setResponse({ error: e.message });
    }
  };

  const getMembers = async () => {
    if (!token) return setResponse({ error: 'Not logged in' });
    try {
      const res = await fetch(`${API_BASE}/api/organizations/${orgId}/members`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setMembers(data);
      setResponse({ success: true, message: `Retrieved ${data.length} members` });
    } catch (e) {
      setResponse({ error: e.message });
    }
  };

  const inviteUser = async () => {
    if (!token) return setResponse({ error: 'Not logged in' });
    if (!inviteEmail) return setResponse({ error: 'Email required' });
    try {
      const res = await fetch(`${API_BASE}/api/organizations/${orgId}/invites`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole })
      });
      const data = await res.json();
      setInviteEmail('');
      setResponse({ success: true, message: 'Invite sent', data });
      getMembers();
    } catch (e) {
      setResponse({ error: e.message });
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>02 - Organization Members & Invites</h1>
      <div style={{ marginBottom: '20px' }}>
        <button onClick={() => login('user-1')}>Login as Alice (Owner)</button>
        <button onClick={() => login('user-2')} style={{ marginLeft: '10px' }}>Login as Bob (Admin)</button>
        <button onClick={() => login('user-3')} style={{ marginLeft: '10px' }}>Login as Charlie</button>
      </div>

      {token && <p style={{ color: 'green' }}>✓ Logged in</p>}

      {token && (
        <div style={{ marginBottom: '20px', padding: '10px', border: '1px solid #ccc' }}>
          <h3>Org {orgId}</h3>
          <button onClick={getMembers}>Get Members</button>
          <div style={{ marginTop: '15px' }}>
            <h4>Send Invite</h4>
            <input type="email" placeholder="Email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} style={{ padding: '5px', marginRight: '10px' }} />
            <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)} style={{ padding: '5px', marginRight: '10px' }}>
              <option>member</option>
              <option>admin</option>
              <option>viewer</option>
            </select>
            <button onClick={inviteUser}>Send</button>
          </div>
        </div>
      )}

      {members.length > 0 && (
        <div style={{ marginBottom: '20px', padding: '10px', border: '1px solid #ddd' }}>
          <h3>Members ({members.length})</h3>
          {members.map((m) => (
            <div key={m.id} style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
              <strong>{m.user.name}</strong> ({m.user.email}) - {m.role}
            </div>
          ))}
        </div>
      )}

      {response && (
        <div style={{ marginTop: '20px', padding: '10px', border: `2px solid ${response.success ? 'green' : 'red'}`, backgroundColor: response.success ? '#f0fff0' : '#fff0f0' }}>
          {response.success ? '✓' : '✗'} {response.message || response.error}
        </div>
      )}
    </div>
  );
}
