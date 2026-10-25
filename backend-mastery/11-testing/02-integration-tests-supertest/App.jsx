import React, { useState } from 'react';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('auth');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState('');
  const API_URL = 'http://localhost:4002/api/secure';

  const executeTest = async (endpoint, method = 'GET', body = null, useToken = true) => {
    setLoading(true);
    try {
      const options = {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(useToken && token && { Authorization: `Bearer ${token}` })
        },
        body: body ? JSON.stringify(body) : undefined
      };
      
      const response = await fetch(`${API_URL}${endpoint}`, options);
      const data = await response.json();
      
      setResults(prev => [{
        timestamp: new Date().toLocaleTimeString(),
        endpoint,
        method,
        status: response.status,
        passed: response.status >= 200 && response.status < 300,
        data
      }, ...prev.slice(0, 9)]);
    } catch (error) {
      setResults(prev => [{
        timestamp: new Date().toLocaleTimeString(),
        endpoint,
        method,
        error: error.message,
        passed: false
      }, ...prev.slice(0, 9)]);
    } finally {
      setLoading(false);
    }
  };

  const AuthTab = () => {
    const [email, setEmail] = useState('alice@test.com');
    const [password, setPassword] = useState('password123');

    const handleLogin = () => {
      executeTest('/login', 'POST', { email, password }, false);
    };

    return (
      <div className="test-section">
        <h2>Authentication & Authorization</h2>
        
        <div className="form-group">
          <label>Email:</label>
          <input value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Password:</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} />
        </div>

        <button onClick={handleLogin} disabled={loading}>Login</button>
        
        <div className="info-box">
          <p>Copy the token from the response and paste it below:</p>
          <input 
            type="text" 
            placeholder="Paste token here" 
            value={token} 
            onChange={e => setToken(e.target.value)}
            style={{ width: '100%', padding: '0.5rem' }}
          />
        </div>

        <h3>Test Accounts:</h3>
        <button onClick={() => { setEmail('alice@test.com'); setPassword('password123'); }}>User: alice@test.com</button>
        <button onClick={() => { setEmail('bob@test.com'); setPassword('password123'); }}>User: bob@test.com</button>
        <button onClick={() => { setEmail('admin@test.com'); setPassword('password123'); }}>Admin: admin@test.com</button>
      </div>
    );
  };

  const UserCRUDTab = () => {
    const [userId, setUserId] = useState('1');
    const [name, setName] = useState('Alice');
    const [email, setEmail] = useState('alice@test.com');

    return (
      <div className="test-section">
        <h2>User CRUD Operations</h2>
        
        <div className="form-group">
          <label>User ID:</label>
          <input type="number" value={userId} onChange={e => setUserId(e.target.value)} />
        </div>

        <div className="button-group">
          <button onClick={() => executeTest(`/users/${userId}`)} disabled={loading || !token}>Get User</button>
          <button onClick={() => executeTest('/users')} disabled={loading || !token}>Get All Users</button>
        </div>

        <h3>Create/Update User</h3>
        <div className="form-group">
          <label>Name:</label>
          <input value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Email:</label>
          <input value={email} onChange={e => setEmail(e.target.value)} />
        </div>

        <div className="button-group">
          <button onClick={() => executeTest('/users', 'POST', { name, email })} disabled={loading || !token}>Create User</button>
          <button onClick={() => userId && executeTest(`/users/${userId}`, 'PUT', { name, email })} disabled={loading || !token || !userId}>Update User</button>
          <button onClick={() => userId && executeTest(`/users/${userId}`, 'DELETE')} disabled={loading || !token || !userId}>Delete User</button>
        </div>
      </div>
    );
  };

  const BatchOpsTab = () => {
    return (
      <div className="test-section">
        <h2>Batch Operations</h2>
        
        <h3>Create Multiple Users</h3>
        <button onClick={() => executeTest('/users/batch', 'POST', {
          users: [
            { name: 'User1', email: 'user1@test.com' },
            { name: 'User2', email: 'user2@test.com' },
            { name: 'User3', email: 'user3@test.com' }
          ]
        })} disabled={loading || !token}>Create 3 Users</button>

        <h3>User Statistics</h3>
        <button onClick={() => executeTest('/users/count')} disabled={loading || !token}>Get User Count</button>
        <button onClick={() => executeTest('/users/active-count')} disabled={loading || !token}>Get Active Users</button>

        <h3>Search & Filter</h3>
        <button onClick={() => executeTest('/users/search?q=alice')} disabled={loading || !token}>Search "alice"</button>
        <button onClick={() => executeTest('/users/search?q=test')} disabled={loading || !token}>Search "test"</button>
      </div>
    );
  };

  const ErrorHandlingTab = () => {
    return (
      <div className="test-section">
        <h2>Error Handling</h2>
        
        <h3>Test Error Cases:</h3>
        <button onClick={() => executeTest('/users/999')} disabled={loading || !token}>Non-existent User (404)</button>
        <button onClick={() => executeTest('/users', 'POST', { name: '' })} disabled={loading || !token}>Invalid Data (400)</button>
        <button onClick={() => executeTest('/users/1', 'DELETE', null, false)}>No Token (401)</button>
        <button onClick={() => executeTest('/error')} disabled={loading || !token}>Server Error (500)</button>

        <div className="info-box">
          <h4>Expected Error Responses:</h4>
          <ul>
            <li>400: Bad Request - Invalid input data</li>
            <li>401: Unauthorized - Missing or invalid token</li>
            <li>403: Forbidden - Insufficient permissions</li>
            <li>404: Not Found - Resource doesn't exist</li>
            <li>500: Server Error - Internal server error</li>
          </ul>
        </div>
      </div>
    );
  };

  return (
    <div className="app">
      <header className="header">
        <h1>Integration Testing with Supertest</h1>
        <p>Test API endpoints with authentication & CRUD operations - Module 02</p>
      </header>

      <div className="container">
        <nav className="tabs">
          <button className={`tab ${activeTab === 'auth' ? 'active' : ''}`} onClick={() => setActiveTab('auth')}>Auth</button>
          <button className={`tab ${activeTab === 'crud' ? 'active' : ''}`} onClick={() => setActiveTab('crud')}>CRUD</button>
          <button className={`tab ${activeTab === 'batch' ? 'active' : ''}`} onClick={() => setActiveTab('batch')}>Batch</button>
          <button className={`tab ${activeTab === 'errors' ? 'active' : ''}`} onClick={() => setActiveTab('errors')}>Errors</button>
        </nav>

        <div className="content">
          {activeTab === 'auth' && <AuthTab />}
          {activeTab === 'crud' && <UserCRUDTab />}
          {activeTab === 'batch' && <BatchOpsTab />}
          {activeTab === 'errors' && <ErrorHandlingTab />}
        </div>

        <div className="results">
          <h2>Test Results ({results.length})</h2>
          {results.length === 0 ? (
            <p className="no-results">No test results yet. Run a test to see results here.</p>
          ) : (
            <div className="results-list">
              {results.map((result, idx) => (
                <div key={idx} className={`result ${result.passed ? 'passed' : 'failed'}`}>
                  <div className="result-header">
                    <span className="time">{result.timestamp}</span>
                    <span className={`status ${result.passed ? 'success' : 'error'}`}>
                      {result.passed ? '✓' : '✗'} {result.status}
                    </span>
                    <span className="endpoint">{result.method} {result.endpoint}</span>
                  </div>
                  <pre className="result-body">
                    {result.error ? result.error : JSON.stringify(result.data, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .app {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        }

        .header {
          background: rgba(0, 0, 0, 0.2);
          color: white;
          padding: 2rem;
          text-align: center;
          border-bottom: 2px solid rgba(255, 255, 255, 0.1);
        }

        .header h1 {
          font-size: 2.5rem;
          margin-bottom: 0.5rem;
        }

        .header p {
          font-size: 1.1rem;
          opacity: 0.9;
        }

        .container {
          max-width: 1200px;
          margin: 2rem auto;
          padding: 0 1rem;
        }

        .tabs {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 2rem;
          flex-wrap: wrap;
          background: rgba(255, 255, 255, 0.1);
          padding: 1rem;
          border-radius: 8px;
          backdrop-filter: blur(10px);
        }

        .tab {
          flex: 1;
          min-width: 80px;
          padding: 0.75rem 1.5rem;
          border: none;
          background: rgba(255, 255, 255, 0.2);
          color: white;
          cursor: pointer;
          border-radius: 6px;
          font-weight: 500;
          transition: all 0.3s ease;
        }

        .tab.active {
          background: rgba(255, 255, 255, 0.4);
          box-shadow: 0 0 20px rgba(0, 0, 0, 0.2);
        }

        .tab:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .content {
          background: white;
          border-radius: 8px;
          padding: 2rem;
          margin-bottom: 2rem;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }

        .test-section {
          margin-bottom: 2rem;
        }

        .test-section h2 {
          color: #333;
          margin-bottom: 1.5rem;
          font-size: 1.5rem;
        }

        .test-section h3 {
          color: #667eea;
          margin-top: 1.5rem;
          margin-bottom: 1rem;
          font-size: 1.1rem;
        }

        .form-group {
          margin-bottom: 1rem;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 600;
          color: #333;
        }

        .form-group input,
        .form-group select {
          width: 100%;
          padding: 0.75rem;
          border: 2px solid #eee;
          border-radius: 4px;
          font-size: 1rem;
          transition: border-color 0.3s;
        }

        .form-group input:focus,
        .form-group select:focus {
          outline: none;
          border-color: #667eea;
        }

        .button-group {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
          margin-bottom: 1rem;
        }

        button {
          padding: 0.75rem 1.5rem;
          background: #667eea;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.3s;
        }

        button:hover:not(:disabled) {
          background: #764ba2;
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
        }

        button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .info-box {
          background: #f5f5f5;
          padding: 1rem;
          border-left: 4px solid #667eea;
          border-radius: 4px;
          margin: 1rem 0;
        }

        .info-box ul {
          margin-left: 1.5rem;
          margin-top: 0.5rem;
        }

        .info-box li {
          margin-bottom: 0.5rem;
          color: #555;
        }

        .results {
          background: white;
          border-radius: 8px;
          padding: 2rem;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }

        .results h2 {
          color: #333;
          margin-bottom: 1.5rem;
        }

        .no-results {
          color: #999;
          text-align: center;
          padding: 2rem;
        }

        .results-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .result {
          border-left: 4px solid #ddd;
          background: #f9f9f9;
          border-radius: 4px;
          overflow: hidden;
        }

        .result.passed {
          border-left-color: #4caf50;
          background: #f1f8f4;
        }

        .result.failed {
          border-left-color: #f44336;
          background: #fdf5f5;
        }

        .result-header {
          display: flex;
          justify-content: space-between;
          padding: 1rem;
          border-bottom: 1px solid #eee;
          font-size: 0.9rem;
        }

        .time {
          color: #999;
          font-weight: 500;
        }

        .status {
          font-weight: 600;
        }

        .status.success {
          color: #4caf50;
        }

        .status.error {
          color: #f44336;
        }

        .endpoint {
          color: #667eea;
          font-weight: 500;
        }

        .result-body {
          padding: 1rem;
          background: white;
          font-size: 0.85rem;
          overflow-x: auto;
          color: #333;
          max-height: 200px;
          overflow-y: auto;
        }
      `}</style>
    </div>
  );
}

export default App;

