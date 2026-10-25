import React, { useState, useRef } from 'react';
import './App.css';

export default function App() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [response, setResponse] = useState(null);
  const verifierRef = useRef(null);

  const API_BASE = 'http://localhost:4007/auth';

  /**
   * Generate PKCE code verifier (43-128 chars, alphanumeric + - _ )
   */
  const generateCodeVerifier = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    let verifier = '';
    for (let i = 0; i < 128; i++) {
      verifier += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return verifier;
  };

  /**
   * Generate PKCE code challenge from verifier
   * challenge = BASE64URL(SHA256(verifier))
   */
  const generateCodeChallenge = async (verifier) => {
    const buffer = new TextEncoder().encode(verifier);
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashString = String.fromCharCode(...hashArray);
    const challenge = btoa(hashString)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
    return challenge;
  };

  /**
   * Step 1: Request authorization code
   */
  const requestAuthCode = async () => {
    setLoading(true);
    setError('');
    try {
      // Generate PKCE verifier and challenge
      const verifier = generateCodeVerifier();
      const challenge = await generateCodeChallenge(verifier);
      
      // Store verifier for later use
      verifierRef.current = verifier;

      const res = await fetch(`${API_BASE}/authorize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code_challenge: challenge,
          redirect_uri: window.location.origin
        })
      });

      const data = await res.json();
      setResponse(data);

      if (!res.ok) throw new Error(data.error);

      // Step 2: Exchange code for token
      await exchangeCodeForToken(data.code);
    } catch (err) {
      setError(err.message);
      setResponse(null);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Step 2: Exchange authorization code for tokens
   */
  const exchangeCodeForToken = async (authCode) => {
    try {
      const res = await fetch(`${API_BASE}/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: authCode,
          code_verifier: verifierRef.current,
          redirect_uri: window.location.origin
        })
      });

      const data = await res.json();
      setResponse(data);

      if (!res.ok) throw new Error(data.error);

      // Store token and user
      setToken(data.access_token);
      setUser(data.user);
      console.log('✓ PKCE flow complete - Token received');
    } catch (err) {
      setError(err.message);
      setToken(null);
      setUser(null);
    }
  };

  /**
   * Fetch current user details
   */
  const fetchUser = async () => {
    if (!token) {
      setError('No token available');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await res.json();
      setResponse(data);

      if (!res.ok) throw new Error(data.error);
      setUser(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Logout
   */
  const handleLogout = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await res.json();
      setResponse(data);

      if (!res.ok) throw new Error(data.error);

      setToken(null);
      setUser(null);
      verifierRef.current = null;
      console.log('✓ Logged out - Token blacklisted');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="card">
        <h2>🔐 PKCE OAuth SPA</h2>
        <p className="subtitle">OAuth 2.0 Authorization Code Flow with PKCE (RFC 7636)</p>

        {error && <div className="error">❌ {error}</div>}

        {user ? (
          <div className="auth-section">
            <div className="user-info">
              <h3>✓ Authenticated</h3>
              <p><strong>ID:</strong> {user.id.substring(0, 12)}...</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Role:</strong> {user.role}</p>
              <p className="token-display">
                <strong>Token:</strong> {token.substring(0, 20)}...
              </p>
            </div>

            <div className="button-group">
              <button onClick={fetchUser} disabled={loading}>
                {loading ? '⏳ Fetching...' : '👤 Get User Info'}
              </button>
              <button onClick={handleLogout} disabled={loading} className="logout-btn">
                {loading ? '⏳ Logging out...' : '🚪 Logout'}
              </button>
            </div>
          </div>
        ) : (
          <div className="auth-section">
            <button 
              onClick={requestAuthCode} 
              disabled={loading}
              className="primary-btn"
            >
              {loading ? '⏳ Authenticating...' : '🔓 Start PKCE Flow'}
            </button>
            <p className="flow-info">
              Flow: Generate Verifier → Request Code → Exchange Code → Receive Token
            </p>
          </div>
        )}

        {response && (
          <div className="response-section">
            <h4>📡 API Response:</h4>
            <pre>{JSON.stringify(response, null, 2)}</pre>
          </div>
        )}

        <div className="info-section">
          <h3>How PKCE Works:</h3>
          <ol>
            <li><strong>Generate code_verifier:</strong> 128 random characters</li>
            <li><strong>Create code_challenge:</strong> SHA256(verifier) in base64url</li>
            <li><strong>Request auth code:</strong> Send code_challenge to /authorize</li>
            <li><strong>Exchange for tokens:</strong> POST code + code_verifier to /token</li>
            <li><strong>Server validates:</strong> SHA256(verifier) == challenge (prevents interception)</li>
            <li><strong>Receive access token:</strong> Use for API requests</li>
          </ol>
          
          <h3>Security Benefits (vs Authorization Code Flow):</h3>
          <ul>
            <li>✓ Protects SPA from authorization code interception</li>
            <li>✓ No client secret needed (proves SPA initiated request)</li>
            <li>✓ Prevents authorization code substitution attacks</li>
            <li>✓ Mobile & public client safe</li>
            <li>✓ Code verifier never crosses network in plaintext</li>
          </ul>

          <h3>When to Use PKCE:</h3>
          <ul>
            <li>✓ Single Page Applications (SPAs)</li>
            <li>✓ Mobile applications</li>
            <li>✓ Desktop applications</li>
            <li>✓ Any public client without backend secrets</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
