import React, { useState, useEffect } from 'react';
import './App.css';

export default function SessionManagement() {
  const [activeTab, setActiveTab] = useState('absolute');
  const [userId, setUserId] = useState('user123');
  const [email, setEmail] = useState('user@example.com');
  const [sessionId, setSessionId] = useState('');
  const [sessionData, setSessionData] = useState(null);
  const [allSessions, setAllSessions] = useState([]);
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);

  const API_URL = 'http://localhost:6416/api';

  // Create session
  const createSession = async (strategy) => {
    setLoading(true);
    try {
      const endpoint = {
        absolute: '/session-absolute',
        idle: '/session-idle',
        rolling: '/session-rolling'
      }[strategy];

      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, email })
      });

      const data = await res.json();
      
      if (data.success) {
        setSessionId(data.sessionId);
        setSessionData(data.session);
        setResponse({
          type: 'success',
          title: 'Session Created',
          data: {
            sessionId: data.sessionId,
            strategy: data.strategy,
            ttl: data.ttl || 'Rolling',
            createdAt: new Date(data.session.createdAt).toLocaleString(),
            expiresAt: data.expiresAt ? new Date(data.expiresAt).toLocaleString() : 'Rolling'
          }
        });
      } else {
        setResponse({ type: 'error', title: 'Error', message: data.error });
      }
    } catch (error) {
      setResponse({ type: 'error', title: 'Error', message: error.message });
    }
    setLoading(false);
  };

  // Get session
  const getSession = async () => {
    if (!sessionId) {
      setResponse({ type: 'warning', title: 'Notice', message: 'No session ID available' });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/session/${sessionId}`);
      const data = await res.json();

      if (res.ok) {
        setSessionData(data.session);
        setResponse({
          type: 'success',
          title: 'Session Retrieved',
          data: {
            found: true,
            userId: data.session.userId,
            email: data.session.email,
            strategy: data.session.strategy,
            age: Math.floor((Date.now() - data.session.createdAt) / 1000) + 's',
            accessCount: data.session.accessCount
          }
        });
      } else {
        setResponse({ type: 'error', title: 'Session Not Found', message: data.error });
      }
    } catch (error) {
      setResponse({ type: 'error', title: 'Error', message: error.message });
    }
    setLoading(false);
  };

  // Refresh session (Rolling strategy only)
  const refreshSession = async () => {
    if (!sessionId) {
      setResponse({ type: 'warning', title: 'Notice', message: 'No session ID available' });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/session/${sessionId}/refresh`, {
        method: 'POST'
      });
      const data = await res.json();

      if (res.ok) {
        setSessionData(data.session);
        setResponse({
          type: 'success',
          title: 'Session Refreshed',
          data: {
            message: data.message,
            accessCount: data.accessCount,
            sessionAge: Math.floor(data.sessionAge / 1000) + 's',
            lastActivityTime: new Date(data.session.lastActivityTime).toLocaleString()
          }
        });
      } else {
        setResponse({ type: 'error', title: 'Session Expired', message: data.error });
      }
    } catch (error) {
      setResponse({ type: 'error', title: 'Error', message: error.message });
    }
    setLoading(false);
  };

  // Logout session
  const logoutSession = async () => {
    if (!sessionId) {
      setResponse({ type: 'warning', title: 'Notice', message: 'No session ID available' });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/session/${sessionId}/logout`, {
        method: 'POST'
      });
      const data = await res.json();

      if (res.ok) {
        setSessionId('');
        setSessionData(null);
        setResponse({
          type: 'success',
          title: 'Session Logged Out',
          data: { message: data.message }
        });
      }
    } catch (error) {
      setResponse({ type: 'error', title: 'Error', message: error.message });
    }
    setLoading(false);
  };

  // Get all sessions for user
  const getAllSessions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/user/${userId}/sessions`);
      const data = await res.json();

      if (data.success) {
        setAllSessions(data.sessions);
        setResponse({
          type: 'success',
          title: 'Active Sessions',
          data: {
            userId: data.userId,
            count: data.activeSessionCount,
            sessions: data.sessions.map(s => ({
              ...s,
              age: Math.floor(s.age / 1000) + 's'
            }))
          }
        });
      }
    } catch (error) {
      setResponse({ type: 'error', title: 'Error', message: error.message });
    }
    setLoading(false);
  };

  // Logout all sessions
  const logoutAll = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/user/${userId}/logout-all`, {
        method: 'POST'
      });
      const data = await res.json();

      setSessionId('');
      setSessionData(null);
      setAllSessions([]);
      setResponse({
        type: 'success',
        title: 'All Sessions Logged Out',
        data: {
          message: data.message,
          sessionsTerminated: data.sessionsTerminated
        }
      });
    } catch (error) {
      setResponse({ type: 'error', title: 'Error', message: error.message });
    }
    setLoading(false);
  };

  // Get statistics
  const getStats = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/stats/sessions`);
      const data = await res.json();

      if (data.success) {
        setResponse({
          type: 'success',
          title: 'Session Statistics',
          data: data.stats
        });
      }
    } catch (error) {
      setResponse({ type: 'error', title: 'Error', message: error.message });
    }
    setLoading(false);
  };

  return (
    <div className="container">
      <header>
        <h1>🔐 Session Management with Redis</h1>
        <p>Three strategies for managing user sessions: Absolute, Idle, and Rolling</p>
      </header>

      <div className="tabs">
        <button className={`tab ${activeTab === 'absolute' ? 'active' : ''}`} onClick={() => setActiveTab('absolute')}>
          Absolute Timeout
        </button>
        <button className={`tab ${activeTab === 'idle' ? 'active' : ''}`} onClick={() => setActiveTab('idle')}>
          Idle Timeout
        </button>
        <button className={`tab ${activeTab === 'rolling' ? 'active' : ''}`} onClick={() => setActiveTab('rolling')}>
          Rolling Expiration
        </button>
        <button className={`tab ${activeTab === 'manage' ? 'active' : ''}`} onClick={() => setActiveTab('manage')}>
          Manage Sessions
        </button>
        <button className={`tab ${activeTab === 'info' ? 'active' : ''}`} onClick={() => setActiveTab('info')}>
          Info
        </button>
      </div>

      <div className="content">
        {/* Configuration */}
        <section style={{ marginBottom: '30px' }}>
          <h2>🔑 Configuration</h2>
          <div className="panel">
            <label>User ID:</label>
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="user123"
            />
            <label>Email:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
            />
            {sessionId && (
              <div style={{ background: '#e3f2fd', padding: '10px', borderRadius: '6px', marginTop: '10px' }}>
                <strong>Current Session ID:</strong><br />
                <code style={{ wordBreak: 'break-all' }}>{sessionId}</code>
              </div>
            )}
          </div>
        </section>

        {/* Absolute Timeout Tab */}
        {activeTab === 'absolute' && (
          <section>
            <h2>⏱️ Absolute Timeout Strategy</h2>
            <p className="description">
              Session expires after a fixed time (default: 30 minutes) regardless of activity.
              Best for: Banking, sensitive data, high-security applications.
            </p>
            <div className="panel">
              <h3>How It Works:</h3>
              <ul>
                <li>User logs in → Session created with 30-minute TTL</li>
                <li>Session expires at fixed time (T + 30min)</li>
                <li>User logged out regardless of activity</li>
                <li>No automatic refresh on access</li>
              </ul>
              <button onClick={() => createSession('absolute')} disabled={loading}>
                💫 Create Session (Absolute)
              </button>
              <button onClick={getSession} disabled={loading}>
                🔍 Get Session Details
              </button>
              <button onClick={logoutSession} disabled={loading}>
                🚪 Logout Session
              </button>
            </div>
          </section>
        )}

        {/* Idle Timeout Tab */}
        {activeTab === 'idle' && (
          <section>
            <h2>🔄 Idle Timeout Strategy</h2>
            <p className="description">
              Session expires if no activity for N minutes (default: 15 min).
              Best for: Most web applications (Gmail, Twitter).
            </p>
            <div className="panel">
              <h3>How It Works:</h3>
              <ul>
                <li>User logs in → Session created</li>
                <li>Each access resets the 15-minute timer</li>
                <li>After 15 min of inactivity → logged out</li>
                <li>No maximum session age</li>
              </ul>
              <button onClick={() => createSession('idle')} disabled={loading}>
                💫 Create Session (Idle)
              </button>
              <button onClick={getSession} disabled={loading}>
                🔍 Get Session Details
              </button>
              <button onClick={logoutSession} disabled={loading}>
                🚪 Logout Session
              </button>
            </div>
          </section>
        )}

        {/* Rolling Expiration Tab */}
        {activeTab === 'rolling' && (
          <section>
            <h2>📊 Rolling Expiration Strategy (Best UX)</h2>
            <p className="description">
              Session extends on each activity, but has a maximum age (default: 8 hours).
              Best for: User-facing content, SaaS applications, dashboards.
            </p>
            <div className="panel">
              <h3>How It Works:</h3>
              <ul>
                <li>User logs in → Session created</li>
                <li>Each access extends TTL by 15 minutes</li>
                <li>Maximum session age: 8 hours (even with activity)</li>
                <li>Perfect balance of UX and security</li>
              </ul>
              <button onClick={() => createSession('rolling')} disabled={loading}>
                💫 Create Session (Rolling)
              </button>
              <button onClick={getSession} disabled={loading}>
                🔍 Get Session Details
              </button>
              <button onClick={refreshSession} disabled={loading}>
                🔄 Refresh Session
              </button>
              <button onClick={logoutSession} disabled={loading}>
                🚪 Logout Session
              </button>
            </div>
          </section>
        )}

        {/* Manage Tab */}
        {activeTab === 'manage' && (
          <section>
            <h2>👥 Manage User Sessions</h2>
            <div className="panel">
              <h3>View All Active Sessions</h3>
              <button onClick={getAllSessions} disabled={loading}>
                📋 Get All Sessions for User
              </button>
              <button onClick={logoutAll} disabled={loading}>
                🔴 Logout All Sessions (All Devices)
              </button>
              <button onClick={getStats} disabled={loading}>
                📊 View Statistics
              </button>
            </div>
          </section>
        )}

        {/* Info Tab */}
        {activeTab === 'info' && (
          <section>
            <h2>📖 Strategy Comparison</h2>
            <div className="panel">
              <table>
                <thead>
                  <tr>
                    <th>Aspect</th>
                    <th>Absolute</th>
                    <th>Idle</th>
                    <th>Rolling</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Security</strong></td>
                    <td>⭐⭐⭐⭐⭐ High</td>
                    <td>⭐⭐⭐ Medium</td>
                    <td>⭐⭐⭐⭐ High</td>
                  </tr>
                  <tr>
                    <td><strong>User Experience</strong></td>
                    <td>⭐⭐ Low</td>
                    <td>⭐⭐⭐ Good</td>
                    <td>⭐⭐⭐⭐⭐ Best</td>
                  </tr>
                  <tr>
                    <td><strong>Implementation</strong></td>
                    <td>⭐⭐⭐⭐⭐ Simplest</td>
                    <td>⭐⭐⭐ Medium</td>
                    <td>⭐⭐⭐⭐ Complex</td>
                  </tr>
                  <tr>
                    <td><strong>Max Session Age</strong></td>
                    <td>Fixed (30 min)</td>
                    <td>Unlimited</td>
                    <td>Fixed (8 hours)</td>
                  </tr>
                  <tr>
                    <td><strong>Auto-logout</strong></td>
                    <td>Yes (fixed)</td>
                    <td>Yes (inactive)</td>
                    <td>Yes (max age)</td>
                  </tr>
                  <tr>
                    <td><strong>Refresh on Access</strong></td>
                    <td>No</td>
                    <td>Yes</td>
                    <td>Yes</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="panel">
              <h3>Use Cases</h3>
              <ul>
                <li><strong>Absolute Timeout:</strong> Banking systems, government portals, healthcare</li>
                <li><strong>Idle Timeout:</strong> Social media, email, community apps</li>
                <li><strong>Rolling Expiration:</strong> Dashboards, SaaS, CMS, e-commerce</li>
              </ul>
            </div>
          </section>
        )}

        {/* Response Display */}
        {response && (
          <div className="response">
            <h3 style={{ color: response.type === 'success' ? '#00ff00' : response.type === 'warning' ? '#ffff00' : '#ff6b6b' }}>
              {response.title}
            </h3>
            {response.message ? (
              <p>{response.message}</p>
            ) : (
              <pre>{JSON.stringify(response.data, null, 2)}</pre>
            )}
          </div>
        )}
      </div>

      <footer>
        <p className="info">
          💡 <strong>Tip:</strong> Create a session above, then check its status with "Get Session Details".
          Try the different strategies to see how they behave differently.
        </p>
      </footer>
    </div>
  );
}
