import React, { useState, useEffect } from 'react';
import './App.css';

export default function MTLSApp() {
  const [activeTab, setActiveTab] = useState('info');
  const [clientInfo, setClientInfo] = useState(null);
  const [certificates, setCertificates] = useState([]);
  const [sessionToken, setSessionToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    clientName: '',
    organizationUnit: '',
    email: ''
  });

  // Fetch client info
  const fetchClientInfo = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('https://localhost:3443/mtls/client-info', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(sessionToken && { 'x-session-token': sessionToken })
        }
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      const data = await response.json();
      setClientInfo(data);
      setSuccess('Client info retrieved successfully');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // List all certificates
  const fetchCertificates = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('https://localhost:3443/mtls/list', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(sessionToken && { 'x-session-token': sessionToken })
        }
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      const data = await response.json();
      setCertificates(data.certificates || []);
      setSuccess('Certificates retrieved successfully');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Register certificate
  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('https://localhost:3443/mtls/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      const data = await response.json();
      setSuccess(`Certificate registered! Client ID: ${data.clientId}`);
      setFormData({ clientName: '', organizationUnit: '', email: '' });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Authenticate and get session token
  const handleAuthenticate = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('https://localhost:3443/mtls/authenticate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      const data = await response.json();
      setSessionToken(data.sessionToken);
      setClientInfo({
        clientId: data.clientId,
        clientName: data.clientName
      });
      setSuccess('Authenticated successfully! Session token obtained.');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Verify token
  const handleVerifyToken = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('https://localhost:3443/mtls/verify-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token: sessionToken })
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      const data = await response.json();
      setSuccess('Token is valid and active');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Validate certificate chain
  const handleValidateChain = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('https://localhost:3443/mtls/validate-chain', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      const data = await response.json();
      setSuccess(`Certificate chain is ${data.valid ? 'valid' : 'invalid'}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="mtls-container">
      <header className="mtls-header">
        <h1>🔐 Certificate-Based Authentication (mTLS)</h1>
        <p>Mutual TLS authentication using X.509 certificates</p>
      </header>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'info' ? 'active' : ''}`}
          onClick={() => setActiveTab('info')}
        >
          Client Info
        </button>
        <button 
          className={`tab ${activeTab === 'register' ? 'active' : ''}`}
          onClick={() => setActiveTab('register')}
        >
          Register
        </button>
        <button 
          className={`tab ${activeTab === 'certificates' ? 'active' : ''}`}
          onClick={() => setActiveTab('certificates')}
        >
          Certificates
        </button>
        <button 
          className={`tab ${activeTab === 'token' ? 'active' : ''}`}
          onClick={() => setActiveTab('token')}
        >
          Token
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'info' && (
          <div className="tab-pane">
            <h2>Client Information</h2>
            <button onClick={fetchClientInfo} disabled={loading}>
              {loading ? 'Loading...' : 'Fetch Client Info'}
            </button>
            {clientInfo && (
              <div className="info-box">
                <pre>{JSON.stringify(clientInfo, null, 2)}</pre>
              </div>
            )}
          </div>
        )}

        {activeTab === 'register' && (
          <div className="tab-pane">
            <h2>Register Certificate</h2>
            <form onSubmit={handleRegister}>
              <div className="form-group">
                <label>Client Name *</label>
                <input
                  type="text"
                  name="clientName"
                  value={formData.clientName}
                  onChange={handleInputChange}
                  placeholder="e.g., api-client-01"
                  required
                />
              </div>
              <div className="form-group">
                <label>Organization Unit</label>
                <input
                  type="text"
                  name="organizationUnit"
                  value={formData.organizationUnit}
                  onChange={handleInputChange}
                  placeholder="e.g., Engineering/Backend"
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="e.g., admin@company.com"
                />
              </div>
              <button type="submit" disabled={loading}>
                {loading ? 'Registering...' : 'Register Certificate'}
              </button>
            </form>
            <div className="info-box">
              <p><strong>Note:</strong> Certificate registration requires connection via mTLS.</p>
              <p>The client certificate is automatically extracted from the TLS handshake.</p>
            </div>
          </div>
        )}

        {activeTab === 'certificates' && (
          <div className="tab-pane">
            <h2>Registered Certificates</h2>
            <button onClick={fetchCertificates} disabled={loading}>
              {loading ? 'Loading...' : 'List Certificates'}
            </button>
            {certificates.length > 0 && (
              <div className="certificates-list">
                <table>
                  <thead>
                    <tr>
                      <th>Client Name</th>
                      <th>Status</th>
                      <th>Registered</th>
                      <th>Last Used</th>
                      <th>Valid Until</th>
                    </tr>
                  </thead>
                  <tbody>
                    {certificates.map(cert => (
                      <tr key={cert.clientId}>
                        <td>{cert.clientName}</td>
                        <td><span className={`badge badge-${cert.status}`}>{cert.status}</span></td>
                        <td>{new Date(cert.registeredAt).toLocaleDateString()}</td>
                        <td>{cert.lastUsed ? new Date(cert.lastUsed).toLocaleDateString() : 'Never'}</td>
                        <td>{new Date(cert.validTo).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'token' && (
          <div className="tab-pane">
            <h2>Session Token Management</h2>
            <div className="button-group">
              <button onClick={handleAuthenticate} disabled={loading}>
                {loading ? 'Authenticating...' : 'Get Session Token'}
              </button>
              <button onClick={handleVerifyToken} disabled={loading || !sessionToken}>
                {loading ? 'Verifying...' : 'Verify Token'}
              </button>
              <button onClick={handleValidateChain} disabled={loading}>
                {loading ? 'Validating...' : 'Validate Chain'}
              </button>
            </div>
            {sessionToken && (
              <div className="info-box">
                <h3>Active Session Token</h3>
                <p><strong>Token:</strong> {sessionToken.substring(0, 32)}...</p>
                <p><strong>Usage:</strong> Add this token to x-session-token header for subsequent requests</p>
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        .mtls-container {
          max-width: 1000px;
          margin: 0 auto;
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .mtls-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px;
          border-radius: 8px;
          margin-bottom: 30px;
          text-align: center;
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
        }

        .tab {
          padding: 12px 20px;
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

        .button-group {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
        }

        .info-box {
          background: #f5f5f5;
          padding: 15px;
          border-radius: 4px;
          margin-top: 15px;
          border-left: 4px solid #667eea;
        }

        pre {
          overflow-x: auto;
          font-size: 12px;
          background: #fff;
          padding: 10px;
          border-radius: 4px;
        }

        .certificates-list table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 15px;
        }

        .certificates-list th,
        .certificates-list td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #eee;
        }

        .certificates-list th {
          background: #f5f5f5;
          font-weight: 600;
        }

        .badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
        }

        .badge-active {
          background: #d4edda;
          color: #155724;
        }

        .badge-revoked {
          background: #f8d7da;
          color: #721c24;
        }

        .badge-expired {
          background: #fff3cd;
          color: #856404;
        }
      `}</style>
    </div>
  );
}
