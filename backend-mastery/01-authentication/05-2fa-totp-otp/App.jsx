import React, { useState } from 'react';
import './index.css';

export default function App() {
  const [stage, setStage] = useState('login'); // login, register, mfa-setup, mfa-verify, dashboard
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    mfaToken: ''
  });
  const [sessionToken, setSessionToken] = useState(null);
  const [qrCode, setQrCode] = useState(null);
  const [secret, setSecret] = useState(null);
  const [backupCodes, setBackupCodes] = useState([]);

  const API_BASE = 'http://localhost:4005/auth';

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.name
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error);
      }

      setFormData({ email: '', password: '', name: '', mfaToken: '' });
      setStage('login');
      setError('Registration successful! Please login.');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error);
      }

      const data = await response.json();
      
      if (data.requiresMFA) {
        setSessionToken(data.sessionToken);
        setStage('mfa-verify');
      } else {
        localStorage.setItem('accessToken', data.accessToken);
        setUser(data.user);
        setStage('dashboard');
      }
      
      setFormData({ email: '', password: '', name: '', mfaToken: '' });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const setupMFA = async () => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE}/mfa/setup`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error);
      }

      const data = await response.json();
      setQrCode(data.qrCode);
      setSecret(data.secret);
      setBackupCodes(data.backupCodes);
      setStage('mfa-setup');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const verifyMFASetup = async () => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE}/mfa/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: formData.mfaToken,
          sessionToken: sessionToken || 'temp'
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error);
      }

      setError('MFA enabled successfully!');
      setQrCode(null);
      setSecret(null);
      setFormData({ email: '', password: '', name: '', mfaToken: '' });
      setStage('dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const verifyMFALogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE}/mfa/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: formData.mfaToken,
          sessionToken
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error);
      }

      const data = await response.json();
      localStorage.setItem('accessToken', data.accessToken);
      setUser(data.user);
      setStage('dashboard');
      setFormData({ email: '', password: '', name: '', mfaToken: '' });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    setUser(null);
    setStage('login');
    setFormData({ email: '', password: '', name: '', mfaToken: '' });
  };

  // Login Form
  if (stage === 'login' || stage === 'register') {
    return (
      <div className="container">
        <div className="card">
          <h2>{stage === 'login' ? 'Login' : 'Register'}</h2>
          {error && <div className={error.includes('successful') ? 'success' : 'error'}>{error}</div>}

          <form onSubmit={stage === 'login' ? handleLogin : handleRegister}>
            {stage === 'register' && (
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  disabled={loading}
                />
              </div>
            )}

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                disabled={loading}
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Loading...' : stage === 'login' ? 'Login' : 'Register'}
            </button>
          </form>

          <p>
            {stage === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              type="button"
              className="link-btn"
              onClick={() => {
                setStage(stage === 'login' ? 'register' : 'login');
                setError('');
                setFormData({ email: '', password: '', name: '', mfaToken: '' });
              }}
            >
              {stage === 'login' ? 'Register' : 'Login'}
            </button>
          </p>
        </div>
      </div>
    );
  }

  // MFA Verify (Login)
  if (stage === 'mfa-verify') {
    return (
      <div className="container">
        <div className="card">
          <h2>Enter MFA Code</h2>
          {error && <div className="error">{error}</div>}

          <form onSubmit={verifyMFALogin}>
            <div className="form-group">
              <label>2FA Code</label>
              <input
                type="text"
                name="mfaToken"
                value={formData.mfaToken}
                onChange={handleInputChange}
                placeholder="000000"
                maxLength="6"
                required
                disabled={loading}
              />
              <small>Enter the 6-digit code from your authenticator app</small>
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify'}
            </button>
          </form>

          <button
            type="button"
            className="link-btn"
            onClick={() => {
              setStage('login');
              setFormData({ email: '', password: '', name: '', mfaToken: '' });
              setSessionToken(null);
            }}
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  // MFA Setup
  if (stage === 'mfa-setup') {
    return (
      <div className="container">
        <div className="card">
          <h2>Setup 2FA Authentication</h2>
          {error && <div className="error">{error}</div>}

          {qrCode && (
            <div>
              <h3>Scan QR Code</h3>
              <img src={qrCode} alt="QR Code" style={{ width: '200px', margin: '20px 0' }} />
              <p>Secret Key: <code>{secret}</code></p>
              
              {backupCodes.length > 0 && (
                <div>
                  <h3>Backup Codes (Save These!)</h3>
                  <ul>
                    {backupCodes.map((code, i) => (
                      <li key={i}><code>{code}</code></li>
                    ))}
                  </ul>
                </div>
              )}

              <form onSubmit={(e) => {
                e.preventDefault();
                verifyMFASetup();
              }}>
                <div className="form-group">
                  <label>Enter 6-digit code from your app:</label>
                  <input
                    type="text"
                    name="mfaToken"
                    value={formData.mfaToken}
                    onChange={handleInputChange}
                    placeholder="000000"
                    maxLength="6"
                    required
                    disabled={loading}
                  />
                </div>

                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Verifying...' : 'Verify & Enable'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Dashboard
  if (stage === 'dashboard') {
    return (
      <div className="container">
        <div className="card">
          <h2>Welcome, {user?.name}!</h2>
          <p>Email: {user?.email}</p>

          <div>
            <h3>Security Settings</h3>
            {user?.mfaEnabled ? (
              <p className="success">✓ 2FA is enabled</p>
            ) : (
              <>
                <p className="warning">2FA is not enabled</p>
                <button onClick={setupMFA} className="btn btn-secondary" disabled={loading}>
                  {loading ? 'Loading...' : 'Setup 2FA'}
                </button>
              </>
            )}
          </div>

          <button onClick={handleLogout} className="btn btn-danger">
            Logout
          </button>
        </div>
      </div>
    );
  }
}
