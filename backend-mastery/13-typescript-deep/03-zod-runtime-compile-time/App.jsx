/**
 * React UI for Zod Validation Module
 * Interactive demo of schema validation patterns
 */

import React, { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:13003/api';

const SchemaDemoBox = ({ title, schema, examples }) => (
  <div style={{ border: '1px solid #ddd', padding: '10px', marginBottom: '15px', borderRadius: '4px' }}>
    <h4>{title}</h4>
    <pre style={{ background: '#f5f5f5', padding: '8px', fontSize: '11px', overflow: 'auto', maxHeight: '150px' }}>
      {JSON.stringify(schema, null, 2)}
    </pre>
    {examples && (
      <div style={{ fontSize: '12px', marginTop: '5px' }}>
        <strong>Example:</strong>
        <pre style={{ background: '#f9f9f9', padding: '8px', fontSize: '10px', margin: '5px 0' }}>
          {JSON.stringify(examples, null, 2)}
        </pre>
      </div>
    )}
  </div>
);

function App() {
  const [users, setUsers] = useState([]);
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);

  // Form states
  const [validationTest, setValidationTest] = useState({ name: '', email: '', role: 'user' });
  const [passwordTest, setPasswordTest] = useState('');
  const [signupTest, setSignupTest] = useState({ email: '', password: '', confirmPassword: '' });
  const [searchTest, setSearchTest] = useState({ query: '', role: '', isActive: '' });

  // Fetch users
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/users`);
      const data = await res.json();
      setResponse(data);
      if (data.ok) setUsers(data.data.items);
    } catch (error) {
      setResponse({ ok: false, error: { message: error.message, code: 'FETCH_ERROR' } });
    } finally {
      setLoading(false);
    }
  };

  // Test validation
  const testValidation = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/validate/user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validationTest)
      });
      const data = await res.json();
      setResponse(data);
    } catch (error) {
      setResponse({ ok: false, error: { message: error.message, code: 'ERROR' } });
    } finally {
      setLoading(false);
    }
  };

  // Test password
  const testPassword = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/validate/password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwordTest })
      });
      const data = await res.json();
      setResponse(data);
    } catch (error) {
      setResponse({ ok: false, error: { message: error.message, code: 'ERROR' } });
    } finally {
      setLoading(false);
    }
  };

  // Test signup
  const testSignup = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/validate/form`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signupTest)
      });
      const data = await res.json();
      setResponse(data);
    } catch (error) {
      setResponse({ ok: false, error: { message: error.message, code: 'ERROR' } });
    } finally {
      setLoading(false);
    }
  };

  // Test search
  const testSearch = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: searchTest.query || undefined,
          role: searchTest.role || undefined,
          isActive: searchTest.isActive === '' ? undefined : searchTest.isActive === 'true'
        })
      });
      const data = await res.json();
      setResponse(data);
    } catch (error) {
      setResponse({ ok: false, error: { message: error.message, code: 'ERROR' } });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>13.3: Zod - Runtime & Compile-time Validation</h1>

      {/* Schema Examples */}
      <div style={{ marginBottom: '20px' }}>
        <h2>Schema Patterns</h2>
        <SchemaDemoBox
          title="User Schema"
          schema={{
            id: 'number (positive)',
            name: 'string (1-100 chars)',
            email: 'string (valid email)',
            role: "'admin' | 'user' | 'moderator'",
            isActive: 'boolean'
          }}
          examples={{
            valid: { id: 1, name: 'Alice', email: 'alice@test.com', role: 'admin', isActive: true },
            invalid: { name: '', email: 'invalid-email', role: 'superuser' }
          }}
        />
        <SchemaDemoBox
          title="Password Schema (Zod Refinements)"
          schema={{
            minLength: '8 characters',
            mustHave: ['Uppercase letter', 'Number'],
            special: 'Optional pattern matching with .refine()'
          }}
          examples={{ valid: 'SecurePass123!', invalid: 'weak' }}
        />
        <SchemaDemoBox
          title="Signup Schema (Cross-field Validation)"
          schema={{
            email: 'string (email)',
            password: 'password schema',
            confirmPassword: 'string (must match password)',
            validation: 'Custom .refine() ensures passwords match'
          }}
          examples={{ valid: { password: 'Secure123!', confirmPassword: 'Secure123!' } }}
        />
      </div>

      {/* Validation Tests */}
      <div style={{ marginBottom: '20px' }}>
        <h2>Interactive Validation Tests</h2>

        {/* User Validation */}
        <div style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '10px' }}>
          <h3>Test: User Schema Validation</h3>
          <input
            placeholder="Name"
            value={validationTest.name}
            onChange={e => setValidationTest({ ...validationTest, name: e.target.value })}
          />
          <input
            placeholder="Email"
            value={validationTest.email}
            onChange={e => setValidationTest({ ...validationTest, email: e.target.value })}
          />
          <select
            value={validationTest.role}
            onChange={e => setValidationTest({ ...validationTest, role: e.target.value })}
          >
            <option>user</option>
            <option>admin</option>
            <option>moderator</option>
          </select>
          <button onClick={testValidation} disabled={loading}>
            Validate
          </button>
        </div>

        {/* Password Validation */}
        <div style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '10px' }}>
          <h3>Test: Password Schema (Refinements)</h3>
          <p style={{ fontSize: '12px', color: '#666' }}>
            Requirements: 8+ chars, uppercase, number, special char
          </p>
          <input
            type="password"
            placeholder="Password"
            value={passwordTest}
            onChange={e => setPasswordTest(e.target.value)}
          />
          <button onClick={testPassword} disabled={loading}>
            Validate Password
          </button>
        </div>

        {/* Signup Form Test */}
        <div style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '10px' }}>
          <h3>Test: Signup Form (Cross-field)</h3>
          <input
            type="email"
            placeholder="Email"
            value={signupTest.email}
            onChange={e => setSignupTest({ ...signupTest, email: e.target.value })}
          />
          <input
            type="password"
            placeholder="Password"
            value={signupTest.password}
            onChange={e => setSignupTest({ ...signupTest, password: e.target.value })}
          />
          <input
            type="password"
            placeholder="Confirm Password"
            value={signupTest.confirmPassword}
            onChange={e => setSignupTest({ ...signupTest, confirmPassword: e.target.value })}
          />
          <button onClick={testSignup} disabled={loading}>
            Validate Form
          </button>
        </div>

        {/* Search Test */}
        <div style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '10px' }}>
          <h3>Test: Search Query (Transforms & Optional)</h3>
          <input
            placeholder="Search query"
            value={searchTest.query}
            onChange={e => setSearchTest({ ...searchTest, query: e.target.value })}
          />
          <select
            value={searchTest.role}
            onChange={e => setSearchTest({ ...searchTest, role: e.target.value })}
          >
            <option value="">All roles</option>
            <option>admin</option>
            <option>user</option>
            <option>moderator</option>
          </select>
          <select
            value={searchTest.isActive}
            onChange={e => setSearchTest({ ...searchTest, isActive: e.target.value })}
          >
            <option value="">All statuses</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
          <button onClick={testSearch} disabled={loading}>
            Search
          </button>
        </div>
      </div>

      {/* Users List */}
      <div style={{ marginBottom: '20px' }}>
        <h2>Users List</h2>
        <button onClick={fetchUsers} disabled={loading}>
          {loading ? 'Loading...' : 'Refresh'}
        </button>
        {users.length === 0 ? (
          <p>No users</p>
        ) : (
          <ul>
            {users.map(user => (
              <li key={user.id}>
                {user.name} ({user.role}) - {user.email} {user.isActive ? '✓' : '✗'}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Response Display */}
      <div>
        <h2>API Response</h2>
        <pre
          style={{
            background: response?.ok ? '#e6ffe6' : '#ffe6e6',
            padding: '10px',
            borderRadius: '4px',
            maxHeight: '300px',
            overflow: 'auto'
          }}
        >
          {JSON.stringify(response, null, 2)}
        </pre>
      </div>
    </div>
  );
}

export default App;

