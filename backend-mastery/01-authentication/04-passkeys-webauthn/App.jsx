import React, { useState } from 'react';
import './index.css';

export default function App() {
  const [isRegister, setIsRegister] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    name: ''
  });
  const [credentials, setCredentials] = useState([]);

  const API_BASE = 'http://localhost:4004/auth';

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const startRegistration = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE}/register/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error);
      }

      const data = await response.json();
      
      // In a real app, you'd use navigator.credentials.create()
      // For demo, simulate credential creation
      const credential = {
        id: 'simulated-credential-' + Math.random().toString(36).substr(2, 9),
        publicKey: 'simulated-public-key',
        counter: 0
      };

      completeRegistration(data.user.id, credential);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const completeRegistration = async (userId, credential) => {
    try {
      const response = await fetch(`${API_BASE}/register/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, credential })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error);
      }

      setFormData({ email: '', name: '' });
      setIsRegister(false);
      setError('Registration successful! You can now authenticate.');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const startAuthentication = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE}/authenticate/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error);
      }

      const data = await response.json();
      
      // In a real app, you'd use navigator.credentials.get()
      // For demo, simulate credential assertion
      const assertion = {
        credentialId: 'simulated-credential-' + Math.random().toString(36).substr(2, 9),
        clientData: 'simulated-client-data',
        authenticatorData: 'simulated-auth-data',
        signature: 'simulated-signature'
      };

      completeAuthentication(data.challengeId, assertion);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const completeAuthentication = async (challengeId, assertion) => {
    try {
      const response = await fetch(`${API_BASE}/authenticate/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeId, assertion })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error);
      }

      const data = await response.json();
      localStorage.setItem('accessToken', data.accessToken);
      setUser(data.user);
      setFormData({ email: '', name: '' });
      fetchCredentials(data.accessToken);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCredentials = async (token) => {
    try {
      const response = await fetch(`${API_BASE}/credentials`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch credentials');

      const data = await response.json();
      setCredentials(data.credentials || []);
    } catch (err) {
      console.error(err.message);
    }
  };

  const deleteCredential = async (credentialId) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE}/credentials/${credentialId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to delete credential');

      setCredentials(credentials.filter(c => c.id !== credentialId));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    setUser(null);
    setCredentials([]);
  };

  if (user) {
    return (
      <div className="container">
        <div className="card">
          <h2>Welcome, {user.name}!</h2>
          <p>Email: {user.email}</p>
          
          <h3>Your Passkeys</h3>
          {credentials.length === 0 ? (
            <p>No passkeys registered yet.</p>
          ) : (
            <ul>
              {credentials.map(cred => (
                <li key={cred.id}>
                  {cred.name || 'Passkey'} - Created: {new Date(cred.createdAt).toLocaleDateString()}
                  <button onClick={() => deleteCredential(cred.id)} className="btn btn-sm btn-danger">
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
          
          <button onClick={handleLogout} className="btn btn-danger">
            Logout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="card">
        <h2>{isRegister ? 'Register with Passkey' : 'Authenticate with Passkey'}</h2>
        {error && <div className="error">{error}</div>}

        <form onSubmit={isRegister ? startRegistration : startAuthentication}>
          {isRegister && (
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

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Loading...' : isRegister ? 'Register' : 'Authenticate'}
          </button>
        </form>

        <p>
          {isRegister ? 'Already have a passkey? ' : "Don't have a passkey? "}
          <button
            type="button"
            className="link-btn"
            onClick={() => {
              setIsRegister(!isRegister);
              setError('');
              setFormData({ email: '', name: '' });
            }}
          >
            {isRegister ? 'Authenticate' : 'Register'}
          </button>
        </p>
      </div>
    </div>
  );
}
