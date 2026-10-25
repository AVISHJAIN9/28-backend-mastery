import React, { useState } from 'react';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('math');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const API_URL = 'http://localhost:5401/api';

  // ==================== Helper Functions ====================

  const executeTest = async (endpoint, method = 'GET', body = null) => {
    setLoading(true);
    try {
      const options = {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined
      };
      
      const response = await fetch(`${API_URL}${endpoint}`, options);
      const data = await response.json();
      
      const result = {
        timestamp: new Date().toLocaleTimeString(),
        endpoint,
        method,
        status: response.status,
        passed: response.status >= 200 && response.status < 300,
        data
      };
      
      setResults(prev => [result, ...prev.slice(0, 9)]);
    } catch (error) {
      setResults(prev => [{
        timestamp: new Date().toLocaleTimeString(),
        endpoint,
        method,
        status: 0,
        passed: false,
        error: error.message
      }, ...prev.slice(0, 9)]);
    } finally {
      setLoading(false);
    }
  };

  // ==================== Math Operations Tests ====================

  const TestMathTab = () => {
    const [operation, setOperation] = useState('add');
    const [a, setA] = useState(5);
    const [b, setB] = useState(3);

    const testMath = () => {
      executeTest('/test/unit-math', 'POST', { operation, a: Number(a), b: Number(b) });
    };

    return (
      <div className="test-section">
        <h2>Math Operations</h2>
        <div className="form-group">
          <label>Operation:</label>
          <select value={operation} onChange={e => setOperation(e.target.value)}>
            <option value="add">Add</option>
            <option value="subtract">Subtract</option>
            <option value="multiply">Multiply</option>
            <option value="divide">Divide</option>
          </select>
        </div>
        
        <div className="form-group">
          <label>Number A:</label>
          <input type="number" value={a} onChange={e => setA(e.target.value)} />
        </div>
        
        <div className="form-group">
          <label>Number B:</label>
          <input type="number" value={b} onChange={e => setB(e.target.value)} />
        </div>
        
        <button onClick={testMath} disabled={loading}>Test Math</button>
        
        <div className="test-cases">
          <h3>Quick Tests:</h3>
          <button onClick={() => { setA(10); setB(5); setTimeout(() => executeTest('/test/unit-math', 'POST', { operation: 'add', a: 10, b: 5 }), 0); }}>Test: 10 + 5</button>
          <button onClick={() => { setA(0); setB(0); setTimeout(() => executeTest('/test/unit-math', 'POST', { operation: 'add', a: 0, b: 0 }), 0); }}>Test: 0 + 0</button>
          <button onClick={() => { setA(100); setB(0); setTimeout(() => executeTest('/test/unit-math', 'POST', { operation: 'divide', a: 100, b: 1 }), 0); }}>Test: 100 / 1</button>
          <button onClick={() => executeTest('/test/unit-math', 'POST', { operation: 'divide', a: 10, b: 0 })}>Test: Divide by Zero (Error)</button>
        </div>
      </div>
    );
  };

  // ==================== Validation Tests ====================

  const TestValidationTab = () => {
    const [emailInput, setEmailInput] = useState('user@example.com');
    const [passwordInput, setPasswordInput] = useState('StrongPass123!');

    return (
      <div className="test-section">
        <h2>Validation Functions</h2>
        
        <div className="validation-test">
          <h3>Email Validation</h3>
          <div className="form-group">
            <input 
              type="email" 
              value={emailInput} 
              onChange={e => setEmailInput(e.target.value)}
              placeholder="Enter email"
            />
          </div>
          <button onClick={() => executeTest('/test/validate-email', 'POST', { email: emailInput })} disabled={loading}>
            Validate Email
          </button>
          
          <div className="test-cases">
            <button onClick={() => { setEmailInput('alice@test.com'); setTimeout(() => executeTest('/test/validate-email', 'POST', { email: 'alice@test.com' }), 0); }}>Valid: alice@test.com</button>
            <button onClick={() => { setEmailInput('invalid-email'); setTimeout(() => executeTest('/test/validate-email', 'POST', { email: 'invalid-email' }), 0); }}>Invalid: invalid-email</button>
            <button onClick={() => { setEmailInput(''); setTimeout(() => executeTest('/test/validate-email', 'POST', { email: '' }), 0); }}>Empty Email</button>
          </div>
        </div>

        <div className="validation-test">
          <h3>Password Validation</h3>
          <div className="form-group">
            <input 
              type="password" 
              value={passwordInput} 
              onChange={e => setPasswordInput(e.target.value)}
              placeholder="Enter password"
            />
          </div>
          <button onClick={() => executeTest('/test/validate-password', 'POST', { password: passwordInput })} disabled={loading}>
            Validate Password
          </button>
          
          <div className="test-cases">
            <button onClick={() => { setPasswordInput('StrongPass123!'); setTimeout(() => executeTest('/test/validate-password', 'POST', { password: 'StrongPass123!' }), 0); }}>Strong: StrongPass123!</button>
            <button onClick={() => { setPasswordInput('weak'); setTimeout(() => executeTest('/test/validate-password', 'POST', { password: 'weak' }), 0); }}>Weak: weak</button>
            <button onClick={() => { setPasswordInput('NoNumbers!'); setTimeout(() => executeTest('/test/validate-password', 'POST', { password: 'NoNumbers!' }), 0); }}>No Numbers: NoNumbers!</button>
          </div>
        </div>
      </div>
    );
  };

  // ==================== User Management Tests ====================

  const TestUserTab = () => {
    const [userName, setUserName] = useState('Alice');
    const [userEmail, setUserEmail] = useState('alice@test.com');
    const [userPassword, setUserPassword] = useState('Password123!');
    const [userId, setUserId] = useState('');

    return (
      <div className="test-section">
        <h2>User Management</h2>
        
        <div className="form-group">
          <label>Name:</label>
          <input value={userName} onChange={e => setUserName(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Email:</label>
          <input value={userEmail} onChange={e => setUserEmail(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Password:</label>
          <input value={userPassword} onChange={e => setUserPassword(e.target.value)} />
        </div>

        <div className="button-group">
          <button onClick={() => executeTest('/test/users', 'POST', { name: userName, email: userEmail, password: userPassword })} disabled={loading}>
            Create User
          </button>
          <button onClick={() => executeTest('/test/users')} disabled={loading}>Get All Users</button>
          <button onClick={() => setUserName(''); setUserEmail(''); setUserPassword('')}>Clear</button>
        </div>

        <h3>User Operations</h3>
        <div className="form-group">
          <label>User ID:</label>
          <input type="number" value={userId} onChange={e => setUserId(e.target.value)} placeholder="Enter user ID" />
        </div>
        
        <div className="button-group">
          <button onClick={() => userId && executeTest(`/test/users/${userId}`)} disabled={loading || !userId}>Get User</button>
          <button onClick={() => userId && executeTest(`/test/users/${userId}`, 'PUT', { name: 'Updated Name' })} disabled={loading || !userId}>Update User</button>
          <button onClick={() => userId && executeTest(`/test/users/${userId}`, 'DELETE')} disabled={loading || !userId}>Delete User</button>
        </div>

        <h3>User Filters & Groups</h3>
        <button onClick={() => executeTest('/test/users/names')} disabled={loading}>Get User Names</button>
        <button onClick={() => executeTest('/test/users/groups/by-age')} disabled={loading}>Group by Age</button>
      </div>
    );
  };

  // ==================== Calculations Tests ====================

  const TestCalculationsTab = () => {
    return (
      <div className="test-section">
        <h2>Calculations</h2>
        
        <h3>Discount Calculator</h3>
        <button onClick={() => executeTest('/test/calculate/discount', 'POST', { price: 100, discountPercent: 0.2 })} disabled={loading}>
          Test: $100 with 20% discount
        </button>
        <button onClick={() => executeTest('/test/calculate/discount', 'POST', { price: 99.99, discountPercent: 0.15 })} disabled={loading}>
          Test: $99.99 with 15% discount
        </button>

        <h3>Tax Calculator</h3>
        <button onClick={() => executeTest('/test/calculate/tax', 'POST', { amount: 100, taxRate: 0.08 })} disabled={loading}>
          Test: $100 with 8% tax
        </button>
        <button onClick={() => executeTest('/test/calculate/tax', 'POST', { amount: 50, taxRate: 0.1 })} disabled={loading}>
          Test: $50 with 10% tax
        </button>

        <h3>Average Calculator</h3>
        <button onClick={() => executeTest('/test/calculate/average', 'POST', { numbers: [10, 20, 30, 40, 50] })} disabled={loading}>
          Test: Average of [10, 20, 30, 40, 50]
        </button>
        <button onClick={() => executeTest('/test/calculate/average', 'POST', { numbers: [1, 2, 3] })} disabled={loading}>
          Test: Average of [1, 2, 3]
        </button>
      </div>
    );
  };

  // ==================== String Operations Tests ====================

  const TestStringTab = () => {
    const [stringInput, setStringInput] = useState('hello world');

    return (
      <div className="test-section">
        <h2>String Operations</h2>
        
        <div className="form-group">
          <label>Text:</label>
          <input value={stringInput} onChange={e => setStringInput(e.target.value)} placeholder="Enter text" />
        </div>

        <div className="button-group">
          <button onClick={() => executeTest('/test/string/capitalize', 'POST', { text: stringInput })} disabled={loading}>Capitalize</button>
          <button onClick={() => executeTest('/test/string/reverse', 'POST', { text: stringInput })} disabled={loading}>Reverse</button>
          <button onClick={() => executeTest('/test/string/palindrome', 'POST', { text: stringInput })} disabled={loading}>Check Palindrome</button>
        </div>

        <h3>Quick Tests:</h3>
        <button onClick={() => { setStringInput('hello'); setTimeout(() => executeTest('/test/string/capitalize', 'POST', { text: 'hello' }), 0); }}>Test: Capitalize "hello"</button>
        <button onClick={() => { setStringInput('racecar'); setTimeout(() => executeTest('/test/string/palindrome', 'POST', { text: 'racecar' }), 0); }}>Test: Palindrome "racecar"</button>
        <button onClick={() => { setStringInput('hello'); setTimeout(() => executeTest('/test/string/reverse', 'POST', { text: 'hello' }), 0); }}>Test: Reverse "hello"</button>
      </div>
    );
  };

  // ==================== Utilities ====================

  const TestUtilitiesTab = () => {
    return (
      <div className="test-section">
        <h2>Testing Utilities</h2>
        
        <button onClick={() => executeTest('/test/info')} disabled={loading}>Get Module Info</button>
        <button onClick={() => executeTest('/test/reset', 'POST')} disabled={loading}>Reset All Test Data</button>
        
        <div className="info-box">
          <p>Use these utilities to:</p>
          <ul>
            <li>Reset all test data between test runs</li>
            <li>Get information about available endpoints</li>
            <li>Clear testing state for clean tests</li>
          </ul>
        </div>
      </div>
    );
  };

  // ==================== Main Render ====================

  return (
    <div className="app">
      <header className="header">
        <h1>Unit Testing with Jest & Vitest</h1>
        <p>Interactive testing demonstration - Module 01</p>
      </header>

      <div className="container">
        <nav className="tabs">
          <button className={`tab ${activeTab === 'math' ? 'active' : ''}`} onClick={() => setActiveTab('math')}>Math</button>
          <button className={`tab ${activeTab === 'validation' ? 'active' : ''}`} onClick={() => setActiveTab('validation')}>Validation</button>
          <button className={`tab ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>Users</button>
          <button className={`tab ${activeTab === 'calculations' ? 'active' : ''}`} onClick={() => setActiveTab('calculations')}>Calculations</button>
          <button className={`tab ${activeTab === 'strings' ? 'active' : ''}`} onClick={() => setActiveTab('strings')}>Strings</button>
          <button className={`tab ${activeTab === 'utilities' ? 'active' : ''}`} onClick={() => setActiveTab('utilities')}>Utilities</button>
        </nav>

        <div className="content">
          {activeTab === 'math' && <TestMathTab />}
          {activeTab === 'validation' && <TestValidationTab />}
          {activeTab === 'users' && <TestUserTab />}
          {activeTab === 'calculations' && <TestCalculationsTab />}
          {activeTab === 'strings' && <TestStringTab />}
          {activeTab === 'utilities' && <TestUtilitiesTab />}
        </div>

        <div className="results">
          <h2>Test Results</h2>
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
          min-width: 100px;
          padding: 0.75rem 1.5rem;
          border: none;
          background: rgba(255, 255, 255, 0.2);
          color: white;
          cursor: pointer;
          border-radius: 6px;
          font-weight: 500;
          transition: all 0.3s ease;
        }

        .tab:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .tab.active {
          background: white;
          color: #667eea;
        }

        .content {
          background: white;
          border-radius: 12px;
          padding: 2rem;
          margin-bottom: 2rem;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        }

        .test-section {
          margin-bottom: 2rem;
        }

        .test-section h2 {
          color: #667eea;
          margin-bottom: 1rem;
          border-bottom: 2px solid #667eea;
          padding-bottom: 0.5rem;
        }

        .test-section h3 {
          color: #764ba2;
          margin: 1rem 0 0.5rem;
          font-size: 1.1rem;
        }

        .form-group {
          margin-bottom: 1rem;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
          color: #333;
        }

        .form-group input,
        .form-group select {
          width: 100%;
          padding: 0.75rem;
          border: 2px solid #eee;
          border-radius: 6px;
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
          margin: 1rem 0;
        }

        button {
          padding: 0.75rem 1.5rem;
          background: #667eea;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.3s ease;
        }

        button:hover:not(:disabled) {
          background: #764ba2;
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
        }

        button:disabled {
          background: #ccc;
          cursor: not-allowed;
          opacity: 0.6;
        }

        .test-cases {
          margin-top: 1rem;
          padding: 1rem;
          background: #f5f5f5;
          border-radius: 6px;
        }

        .test-cases button {
          display: inline-block;
          margin: 0.5rem 0.5rem 0.5rem 0;
        }

        .validation-test {
          margin-bottom: 2rem;
          padding: 1.5rem;
          background: #f9f9f9;
          border-radius: 6px;
          border-left: 4px solid #667eea;
        }

        .info-box {
          background: #e8f5e9;
          border-left: 4px solid #4caf50;
          padding: 1rem;
          border-radius: 6px;
          margin-top: 1rem;
        }

        .info-box ul {
          margin-left: 1.5rem;
          margin-top: 0.5rem;
        }

        .results {
          background: white;
          border-radius: 12px;
          padding: 2rem;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        }

        .results h2 {
          color: #667eea;
          margin-bottom: 1rem;
        }

        .no-results {
          color: #999;
          text-align: center;
          padding: 2rem;
        }

        .results-list {
          max-height: 600px;
          overflow-y: auto;
        }

        .result {
          margin-bottom: 1rem;
          border: 2px solid #eee;
          border-radius: 6px;
          overflow: hidden;
        }

        .result.passed {
          border-left: 4px solid #4caf50;
          background: #f1f8f4;
        }

        .result.failed {
          border-left: 4px solid #f44336;
          background: #fdeaea;
        }

        .result-header {
          display: flex;
          gap: 1rem;
          padding: 0.75rem 1rem;
          background: rgba(0, 0, 0, 0.02);
          flex-wrap: wrap;
          align-items: center;
        }

        .time {
          color: #999;
          font-size: 0.9rem;
        }

        .status {
          font-weight: bold;
          padding: 0.25rem 0.75rem;
          border-radius: 4px;
        }

        .status.success {
          background: #4caf50;
          color: white;
        }

        .status.error {
          background: #f44336;
          color: white;
        }

        .endpoint {
          color: #667eea;
          font-family: monospace;
          font-size: 0.9rem;
        }

        .result-body {
          padding: 1rem;
          background: white;
          overflow-x: auto;
          font-size: 0.85rem;
          line-height: 1.4;
          color: #333;
        }

        @media (max-width: 768px) {
          .header h1 {
            font-size: 1.8rem;
          }

          .tab {
            min-width: 80px;
            padding: 0.5rem 1rem;
            font-size: 0.9rem;
          }

          .content,
          .results {
            padding: 1rem;
          }

          .result-header {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
}

export default App;

