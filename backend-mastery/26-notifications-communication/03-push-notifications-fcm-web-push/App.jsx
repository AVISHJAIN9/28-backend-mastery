import React, { useState, useEffect } from 'react';

export default function App() {
  const [token, setToken] = useState(null);
  const [activeTab, setActiveTab] = useState('devices');
  const [response, setResponse] = useState(null);
  const [devices, setDevices] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  // Form states
  const [registerForm, setRegisterForm] = useState({ platform: 'fcm', token: '' });
  const [sendForm, setSendForm] = useState({ deviceId: '', title: '', body: '' });
  const [batchForm, setBatchForm] = useState({ deviceIds: '', title: '', body: '' });

  // Auto-refresh data every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (token) {
        refreshData();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [token]);

  const refreshData = async () => {
    if (!token) return;
    try {
      const [devicesRes, statsRes, logsRes] = await Promise.all([
        fetch('http://localhost:4003/api/devices', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('http://localhost:4003/api/stats', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('http://localhost:4003/api/notifications/logs?limit=20', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (devicesRes.ok) {
        const data = await devicesRes.json();
        setDevices(Array.isArray(data.devices) ? data.devices : []);
      }
      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data.stats);
      }
      if (logsRes.ok) {
        const data = await logsRes.json();
        setNotifications(Array.isArray(data.logs) ? data.logs : []);
      }
    } catch (error) {
      console.error('Refresh failed:', error);
    }
  };

  const generateTestToken = () => {
    // Mock JWT token generator - in production, get from backend
    const payload = { id: 1, email: 'user@test.com', role: 'user' };
    // For testing, using hardcoded valid token format
    const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJ1c2VyQHRlc3QuY29tIiwicm9sZSI6InVzZXIifQ.test';
    setToken(mockToken);
    setResponse({ message: 'Test token generated', token: mockToken });
    refreshData();
  };

  const makeRequest = async (endpoint, method = 'GET', body = null) => {
    if (!token) {
      setResponse({ error: 'No token set. Generate test token first.' });
      return;
    }

    setLoading(true);
    try {
      const options = {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      };
      if (body) options.body = JSON.stringify(body);

      const res = await fetch(`http://localhost:4003${endpoint}`, options);
      const data = await res.json();

      setResponse({
        status: res.status,
        body: data,
        timestamp: new Date().toLocaleTimeString()
      });

      // Refresh data after mutations
      if (method !== 'GET') {
        setTimeout(refreshData, 500);
      }
    } catch (error) {
      setResponse({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  // ============ HANDLERS ============

  const handleRegisterDevice = async () => {
    if (!registerForm.platform || !registerForm.token) {
      setResponse({ error: 'Platform and token are required' });
      return;
    }

    const body = {
      platform: registerForm.platform,
      token: registerForm.token,
      subscriptionEndpoint: registerForm.platform === 'web-push' ? registerForm.token : undefined,
      subscriptionAuth: registerForm.platform === 'web-push' ? 'mock-auth' : undefined
    };

    await makeRequest('/api/devices/register', 'POST', body);
    setRegisterForm({ platform: 'fcm', token: '' });
  };

  const handleSendNotification = async () => {
    if (!sendForm.deviceId || !sendForm.title || !sendForm.body) {
      setResponse({ error: 'Device ID, title, and body are required' });
      return;
    }

    await makeRequest('/api/notifications/send', 'POST', {
      deviceId: sendForm.deviceId,
      title: sendForm.title,
      body: sendForm.body,
      data: { timestamp: new Date().toISOString() }
    });
    setSendForm({ deviceId: '', title: '', body: '' });
  };

  const handleBatchNotification = async () => {
    if (!batchForm.deviceIds || !batchForm.title || !batchForm.body) {
      setResponse({ error: 'Device IDs, title, and body are required' });
      return;
    }

    const deviceIds = batchForm.deviceIds.split(',').map(id => id.trim());
    if (deviceIds.length === 0 || deviceIds.length > 1000) {
      setResponse({ error: 'Provide 1-1000 device IDs' });
      return;
    }

    await makeRequest('/api/notifications/batch', 'POST', {
      deviceIds,
      title: batchForm.title,
      body: batchForm.body
    });
    setBatchForm({ deviceIds: '', title: '', body: '' });
  };

  const handleUnsubscribe = async (deviceId) => {
    await makeRequest('/api/devices/unsubscribe', 'POST', { deviceId });
  };

  // ============ RENDER ============

  return (
    <div className="container">
      <header className="header">
        <h1>🔔 Push Notifications Module</h1>
        <p>Firebase Cloud Messaging & Web Push API</p>
      </header>

      {/* Authentication */}
      <section className="auth-section">
        <div className="auth-box">
          <h3>Authentication</h3>
          <div className="token-display">
            <input
              type="text"
              placeholder="Paste JWT token or generate test token"
              value={token || ''}
              onChange={(e) => setToken(e.target.value)}
              className="token-input"
            />
            <button onClick={generateTestToken} className="btn btn-primary">
              Generate Test Token
            </button>
          </div>
          {token && <p className="token-status">✅ Authenticated</p>}
        </div>
      </section>

      {/* Tabs */}
      <nav className="tabs">
        <button
          className={`tab ${activeTab === 'devices' ? 'active' : ''}`}
          onClick={() => setActiveTab('devices')}
        >
          📱 Devices
        </button>
        <button
          className={`tab ${activeTab === 'send' ? 'active' : ''}`}
          onClick={() => setActiveTab('send')}
        >
          ✉️ Send
        </button>
        <button
          className={`tab ${activeTab === 'batch' ? 'active' : ''}`}
          onClick={() => setActiveTab('batch')}
        >
          📤 Batch
        </button>
        <button
          className={`tab ${activeTab === 'logs' ? 'active' : ''}`}
          onClick={() => setActiveTab('logs')}
        >
          📋 Logs
        </button>
        <button
          className={`tab ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          📊 Stats
        </button>
      </nav>

      {/* Content */}
      <main className="content">
        {/* DEVICES TAB */}
        {activeTab === 'devices' && (
          <section className="tab-content">
            <h2>Device Management</h2>

            <div className="form-section">
              <h3>Register Device</h3>
              <div className="form-group">
                <label>Platform</label>
                <select
                  value={registerForm.platform}
                  onChange={(e) => setRegisterForm({ ...registerForm, platform: e.target.value })}
                  className="form-control"
                >
                  <option value="fcm">Firebase Cloud Messaging (FCM)</option>
                  <option value="web-push">Web Push API</option>
                </select>
              </div>

              <div className="form-group">
                <label>
                  {registerForm.platform === 'fcm' ? 'FCM Token' : 'Web Push Endpoint'}
                </label>
                <input
                  type="text"
                  placeholder={
                    registerForm.platform === 'fcm'
                      ? 'cNf4pT7sL9mKx3bQ6vY2aZ8wH1jE5gR4tU0dP3oN6sL'
                      : 'https://fcm.googleapis.com/fcm/send/...'
                  }
                  value={registerForm.token}
                  onChange={(e) => setRegisterForm({ ...registerForm, token: e.target.value })}
                  className="form-control"
                />
              </div>

              <button
                onClick={handleRegisterDevice}
                disabled={loading}
                className="btn btn-success"
              >
                {loading ? 'Registering...' : 'Register Device'}
              </button>
            </div>

            {/* Devices List */}
            <div className="devices-section">
              <h3>Registered Devices ({devices.length})</h3>
              {devices.length === 0 ? (
                <p className="empty">No devices registered yet</p>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Device ID</th>
                      <th>Platform</th>
                      <th>Status</th>
                      <th>Registered</th>
                      <th>Last Used</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {devices.map((device) => (
                      <tr key={device.deviceId}>
                        <td className="mono">{device.deviceId}</td>
                        <td>
                          <span className={`badge badge-${device.platform}`}>
                            {device.platform}
                          </span>
                        </td>
                        <td>
                          <span className={`status ${device.isActive ? 'active' : 'inactive'}`}>
                            {device.isActive ? '✅ Active' : '❌ Inactive'}
                          </span>
                        </td>
                        <td className="time">{new Date(device.registeredAt).toLocaleDateString()}</td>
                        <td className="time">{new Date(device.lastUsedAt).toLocaleDateString()}</td>
                        <td>
                          <button
                            onClick={() => handleUnsubscribe(device.deviceId)}
                            className="btn btn-sm btn-danger"
                          >
                            Unsubscribe
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        )}

        {/* SEND TAB */}
        {activeTab === 'send' && (
          <section className="tab-content">
            <h2>Send Single Notification</h2>

            <div className="form-section">
              <div className="form-group">
                <label>Device ID</label>
                <input
                  type="text"
                  placeholder="device_1001"
                  value={sendForm.deviceId}
                  onChange={(e) => setSendForm({ ...sendForm, deviceId: e.target.value })}
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label>Title</label>
                <input
                  type="text"
                  placeholder="New Message"
                  value={sendForm.title}
                  onChange={(e) => setSendForm({ ...sendForm, title: e.target.value })}
                  className="form-control"
                  maxLength="200"
                />
                <small>{sendForm.title.length}/200</small>
              </div>

              <div className="form-group">
                <label>Body</label>
                <textarea
                  placeholder="You have a new message from Alice"
                  value={sendForm.body}
                  onChange={(e) => setSendForm({ ...sendForm, body: e.target.value })}
                  className="form-control"
                  rows="4"
                  maxLength="4000"
                />
                <small>{sendForm.body.length}/4000</small>
              </div>

              <button
                onClick={handleSendNotification}
                disabled={loading}
                className="btn btn-primary"
              >
                {loading ? 'Sending...' : 'Send Notification'}
              </button>
            </div>

            <div className="hint-box">
              <p>💡 <strong>Tip:</strong> Use a device ID from the Devices tab</p>
            </div>
          </section>
        )}

        {/* BATCH TAB */}
        {activeTab === 'batch' && (
          <section className="tab-content">
            <h2>Send Batch Notifications</h2>

            <div className="form-section">
              <div className="form-group">
                <label>Device IDs (comma-separated, max 1000)</label>
                <textarea
                  placeholder="device_1001, device_1002, device_1003"
                  value={batchForm.deviceIds}
                  onChange={(e) => setBatchForm({ ...batchForm, deviceIds: e.target.value })}
                  className="form-control"
                  rows="4"
                />
              </div>

              <div className="form-group">
                <label>Title</label>
                <input
                  type="text"
                  placeholder="System Update"
                  value={batchForm.title}
                  onChange={(e) => setBatchForm({ ...batchForm, title: e.target.value })}
                  className="form-control"
                  maxLength="200"
                />
              </div>

              <div className="form-group">
                <label>Body</label>
                <textarea
                  placeholder="Version 2.0 available now"
                  value={batchForm.body}
                  onChange={(e) => setBatchForm({ ...batchForm, body: e.target.value })}
                  className="form-control"
                  rows="4"
                  maxLength="4000"
                />
              </div>

              <button
                onClick={handleBatchNotification}
                disabled={loading}
                className="btn btn-warning"
              >
                {loading ? 'Sending...' : `Send to ${batchForm.deviceIds.split(',').filter(d => d.trim()).length} Devices`}
              </button>
            </div>

            <div className="hint-box">
              <p>💡 Perfect for announcements to multiple users at once</p>
            </div>
          </section>
        )}

        {/* LOGS TAB */}
        {activeTab === 'logs' && (
          <section className="tab-content">
            <h2>Notification Logs</h2>

            <button onClick={() => makeRequest('/api/notifications/logs?limit=50')} className="btn btn-secondary">
              Refresh Logs
            </button>

            {notifications.length === 0 ? (
              <p className="empty">No notifications yet</p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Device</th>
                    <th>Title</th>
                    <th>Status</th>
                    <th>Sent</th>
                    <th>Delivered</th>
                    <th>Clicked</th>
                  </tr>
                </thead>
                <tbody>
                  {notifications.map((notif) => (
                    <tr key={notif.id}>
                      <td className="mono small">{notif.id}</td>
                      <td className="mono small">{notif.deviceId}</td>
                      <td>{notif.title}</td>
                      <td>
                        <span className={`status-badge status-${notif.status}`}>
                          {notif.status}
                        </span>
                      </td>
                      <td className="time small">{new Date(notif.sentAt).toLocaleTimeString()}</td>
                      <td className="time small">
                        {notif.deliveredAt ? new Date(notif.deliveredAt).toLocaleTimeString() : '-'}
                      </td>
                      <td className="time small">
                        {notif.clickedAt ? '✅' : '❌'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        )}

        {/* STATS TAB */}
        {activeTab === 'stats' && (
          <section className="tab-content">
            <h2>Engagement Statistics</h2>

            <button onClick={() => makeRequest('/api/stats')} className="btn btn-secondary">
              Refresh Stats
            </button>

            {stats ? (
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-value">{stats.sent}</div>
                  <div className="stat-label">Total Sent</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{stats.delivered}</div>
                  <div className="stat-label">Delivered</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{stats.clicked}</div>
                  <div className="stat-label">Clicked</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{stats.bounced}</div>
                  <div className="stat-label">Bounced</div>
                </div>
                <div className="stat-card highlight">
                  <div className="stat-value">{(stats.deliveryRate || 0).toFixed(1)}%</div>
                  <div className="stat-label">Delivery Rate</div>
                </div>
                <div className="stat-card highlight">
                  <div className="stat-value">{(stats.engagementRate || 0).toFixed(1)}%</div>
                  <div className="stat-label">Engagement Rate</div>
                </div>
              </div>
            ) : (
              <p className="empty">No stats available yet</p>
            )}
          </section>
        )}
      </main>

      {/* Response Display */}
      {response && (
        <section className="response-section">
          <h3>API Response</h3>
          <div className={`response-box ${response.error ? 'error' : 'success'}`}>
            <pre>{JSON.stringify(response, null, 2)}</pre>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="footer">
        <p>
          🚀 Module 03: Push Notifications (FCM & Web Push) | Port 4003 |{' '}
          <a href="http://localhost:4003/health" target="_blank" rel="noreferrer">
            Health Check
          </a>
        </p>
      </footer>
    </div>
  );
}
