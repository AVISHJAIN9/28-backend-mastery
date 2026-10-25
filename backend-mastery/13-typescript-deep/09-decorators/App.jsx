import React, { useState } from 'react';

export default function App() {
  const [response, setResponse] = useState(null);

  const testDecorator = async (endpoint) => {
    try {
      const res = await fetch(`http://localhost:13009${endpoint}`);
      const data = await res.json();
      setResponse(data);
    } catch (error) {
      setResponse({ error: error.message });
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>TypeScript Decorators Test</h1>
      <div style={{ marginBottom: '20px' }}>
        <button onClick={() => testDecorator('/api/decorator-info')}>
          Get Decorator Info
        </button>
        <button onClick={() => testDecorator('/api/users/1')}>
          Get User (with decorators)
        </button>
        <button onClick={() => testDecorator('/health')}>
          Health Check
        </button>
      </div>
      <pre>{JSON.stringify(response, null, 2)}</pre>
    </div>
  );
}
