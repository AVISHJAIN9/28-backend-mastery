import React, { useState, useEffect } from 'react';
import './App.css';

export default function LDAPApp() {
  const [activeTab, setActiveTab] = useState('login');
  const [token, setToken] = useState('');
  const [user, setUser] = useState(null);
  const [groups, setGroups] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
    searchQuery: ''
  });

  // Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:3000/ldap/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password
        })
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();
      setToken(data.sessionToken);
      setUser(data.user);
      setSuccess('Login successful!');
      setFormData({ ...formData, password: '' });
      setActiveTab('profile');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch user groups
  const fetchGroups = async () => {
    if (!token) return;

    setLoading(true);
    setError('');
    try {
      const response = await fetch('http://localhost:3000/ldap/groups', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to fetch groups');

      const data = await response.json();
      setGroups(data.groups);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Search users
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!token) return;

    setLoading(true);
    setError('');
    try {
      const response = await fetch(
        `http://localhost:3000/ldap/search?query=${formData.searchQuery}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) throw new Error('Search failed');

      const data = await response.json();
      setSearchResults(data.users);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Change password
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!token) return;

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:3000/ldap/change-password', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          oldPassword: formData.oldPassword,
          newPassword: formData.newPassword
        })
      });

      if (!response.ok) throw new Error('Password change failed');

      setSuccess('Password changed successfully!');
      setFormData({
        ...formData,
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const handleLogout = async () => {
    if (!token) return;

    try {
      await fetch('http://localhost:3000/ldap/logout', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      setToken('');
      setUser(null);
      setGroups([]);
      setSuccess('Logged out successfully');
      setActiveTab('login');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="ldap-container">
      <header className="ldap-header">
        <h1>🔐 LDAP & Active Directory Authentication</h1>
        <p>Enterprise directory authentication integration</p>
        {token && <p className="user-info">Logged in as: {user?.username}</p>}
      </header>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'login' ? 'active' : ''}`}
          onClick={() => setActiveTab('login')}
        >
          Login
        </button>
        {token && (
          <>
            <button
              className={`tab ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              Profile
            </button>
            <button
              className={`tab ${activeTab === 'groups' ? 'active' : ''}`}
              onClick={() => { setActiveTab('groups'); fetchGroups(); }}
            >
              Groups
            </button>
            <button
              className={`tab ${activeTab === 'search' ? 'active' : ''}`}
              onClick={() => setActiveTab('search')}
            >
              Search Users
            </button>
            <button
              className={`tab ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              Settings
            </button>
          </>
        )}
      </div>

      <div className="tab-content">
        {activeTab === 'login' && (
          <div className="tab-pane">
            <h2>LDAP / Active Directory Login</h2>
            {!token ? (
              <form onSubmit={handleLogin}>
                <div className="form-group">
                  <label>Username *</label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    placeholder="Enter your username"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Password *</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Enter your password"
                    required
                  />
                </div>
                <button type="submit" disabled={loading}>
                  {loading ? 'Logging in...' : 'Login'}
                </button>
              </form>
            ) : (
              <div className="success-message">
                <p>✓ You are logged in</p>
                <button onClick={handleLogout}>Logout</button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'profile' && token && (
          <div className="tab-pane">
            <h2>Your Profile</h2>
            {user && (
              <div className="profile-card">
                <p><strong>Username:</strong> {user.username}</p>
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Full Name:</strong> {user.fullName}</p>
                <p><strong>Groups:</strong> {user.groups?.join(', ') || 'None'}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'groups' && token && (
          <div className="tab-pane">
            <h2>Your Groups</h2>
            {loading ? (
              <p>Loading...</p>
            ) : groups.length > 0 ? (
              <div className="groups-list">
                {groups.map((group, index) => (
                  <div key={index} className="group-item">
                    <strong>{group.cn}</strong>
                    {group.description && <p>{group.description}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <p>No groups found</p>
            )}
          </div>
        )}

        {activeTab === 'search' && token && (
          <div className="tab-pane">
            <h2>Search Directory</h2>
            <form onSubmit={handleSearch}>
              <div className="form-group">
                <label>Search Query</label>
                <input
                  type="text"
                  name="searchQuery"
                  value={formData.searchQuery}
                  onChange={handleInputChange}
                  placeholder="Search by name, email, or username..."
                />
              </div>
              <button type="submit" disabled={loading}>
                {loading ? 'Searching...' : 'Search'}
              </button>
            </form>

            {searchResults.length > 0 && (
              <table className="results-table">
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Department</th>
                  </tr>
                </thead>
                <tbody>
                  {searchResults.map((result, index) => (
                    <tr key={index}>
                      <td>{result.uid}</td>
                      <td>{result.cn}</td>
                      <td>{result.mail}</td>
                      <td>{result.department || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === 'settings' && token && (
          <div className="tab-pane">
            <h2>Security Settings</h2>
            <h3>Change Password</h3>
            <form onSubmit={handleChangePassword}>
              <div className="form-group">
                <label>Current Password *</label>
                <input
                  type="password"
                  name="oldPassword"
                  value={formData.oldPassword}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>New Password *</label>
                <input
                  type="password"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Confirm Password *</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <button type="submit" disabled={loading}>
                {loading ? 'Changing...' : 'Change Password'}
              </button>
            </form>
          </div>
        )}
      </div>

      <style>{`
        .ldap-container {
          max-width: 900px;
          margin: 0 auto;
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .ldap-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px;
          border-radius: 8px;
          margin-bottom: 30px;
          text-align: center;
        }

        .user-info {
          font-size: 14px;
          margin-top: 10px;
          opacity: 0.9;
        }

        .alert {
          padding: 15px;
          margin-bottom: 20px;
          border-radius: 4px;
          border-left: 4px solid;
        }

        .alert-error {
          background-color: #fee;
          border-color: #c33;
          color: #c33;
        }

        .alert-success {
          background-color: #efe;
          border-color: #3c3;
          color: #3c3;
        }

        .tabs {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
          border-bottom: 2px solid #eee;
          flex-wrap: wrap;
        }

        .tab {
          padding: 12px 16px;
          border: none;
          background: none;
          cursor: pointer;
          font-size: 14px;
          border-bottom: 3px solid transparent;
          transition: all 0.3s;
        }

        .tab.active {
          border-bottom-color: #667eea;
          color: #667eea;
          font-weight: bold;
        }

        .tab-pane {
          background: white;
          padding: 30px;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 500;
        }

        .form-group input {
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
          box-sizing: border-box;
        }

        button {
          padding: 10px 20px;
          background: #667eea;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
        }

        button:hover:not(:disabled) {
          background: #5568d3;
        }

        button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .success-message {
          text-align: center;
          padding: 20px;
        }

        .profile-card {
          background: #f5f5f5;
          padding: 20px;
          border-radius: 4px;
        }

        .profile-card p {
          margin: 10px 0;
        }

        .groups-list {
          display: grid;
          gap: 10px;
        }

        .group-item {
          background: #f5f5f5;
          padding: 15px;
          border-left: 4px solid #667eea;
          border-radius: 4px;
        }

        .group-item strong {
          display: block;
          margin-bottom: 5px;
        }

        .results-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }

        .results-table th,
        .results-table td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #eee;
        }

        .results-table th {
          background: #f5f5f5;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
}
