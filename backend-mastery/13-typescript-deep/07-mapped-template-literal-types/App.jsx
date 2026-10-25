import React, { useState } from 'react';

const API_URL = 'http://localhost:13007/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('mapped');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const testMappedTypes = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/mapped/transform`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          object: { id: 1, name: 'John', password: 'secret' },
          operation: 'omit'
        })
      });
      const data = await res.json();
      setResults([...results, { name: 'Mapped Types', output: JSON.stringify(data.data, null, 2) }]);
    } catch (err) {
      setResults([...results, { name: 'Error', output: err.message }]);
    } finally {
      setLoading(false);
    }
  };

  const testTemplateLiterals = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/mapped/get-property`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          object: { id: 1, name: 'John' },
          property: 'name'
        })
      });
      const data = await res.json();
      setResults([...results, { name: 'Template Literals', output: JSON.stringify(data.data, null, 2) }]);
    } catch (err) {
      setResults([...results, { name: 'Error', output: err.message }]);
    } finally {
      setLoading(false);
    }
  };

  const testCreateHandlers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/mapped/create-handlers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ object: { id: 1, name: 'John' } })
      });
      const data = await res.json();
      setResults([...results, { name: 'Generated Handlers', output: JSON.stringify(data.data, null, 2) }]);
    } catch (err) {
      setResults([...results, { name: 'Error', output: err.message }]);
    } finally {
      setLoading(false);
    }
  };

  const testColumnMapping = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/mapped/map-columns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dbRecord: { user_id: 1, first_name: 'John' } })
      });
      const data = await res.json();
      setResults([...results, { name: 'Column Mapping', output: JSON.stringify(data.data, null, 2) }]);
    } catch (err) {
      setResults([...results, { name: 'Error', output: err.message }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>Module 13.7 - Mapped & Template Literal Types</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <button onClick={() => setActiveTab('mapped')} style={{ marginRight: '10px', padding: '8px 16px' }}>
          Mapped Types
        </button>
        <button onClick={() => setActiveTab('columns')} style={{ marginRight: '10px', padding: '8px 16px' }}>
          Column Mapping
        </button>
        <button onClick={() => setActiveTab('events')} style={{ padding: '8px 16px' }}>
          Event Handlers
        </button>
      </div>

      {activeTab === 'mapped' && (
        <div style={{ border: '1px solid #ccc', padding: '15px' }}>
          <h3>Mapped Types: [K in keyof T]</h3>
          <p>Transform properties using mapped types: Pick, Omit, Readonly, Partial</p>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            <button onClick={testMappedTypes} disabled={loading} style={{ padding: '8px 16px', cursor: 'pointer' }}>
              Test Pick/Omit
            </button>
            <button onClick={testCreateHandlers} disabled={loading} style={{ padding: '8px 16px', cursor: 'pointer' }}>
              Test Getters/Setters
            </button>
          </div>
        </div>
      )}

      {activeTab === 'columns' && (
        <div style={{ border: '1px solid #ccc', padding: '15px' }}>
          <h3>Column Mapping</h3>
          <p>Map database columns to API format using mapped types</p>
          <button onClick={testColumnMapping} disabled={loading} style={{ padding: '8px 16px', cursor: 'pointer' }}>
            Map Columns
          </button>
        </div>
      )}

      {activeTab === 'events' && (
        <div style={{ border: '1px solid #ccc', padding: '15px' }}>
          <h3>Template Literal Types</h3>
          <p>Template literal types generate handler names</p>
          <button onClick={testTemplateLiterals} disabled={loading} style={{ padding: '8px 16px', cursor: 'pointer' }}>
            Test Template Literals
          </button>
        </div>
      )}

      {results.length > 0 && (
        <div style={{ marginTop: '20px', border: '1px solid #ccc', padding: '15px' }}>
          <h3>Results</h3>
          {results.map((r, idx) => (
            <div key={idx} style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
              <strong>{r.name}</strong>
              <pre style={{ fontSize: '12px', overflow: 'auto', marginTop: '5px' }}>
                {r.output}
              </pre>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: '30px', fontSize: '12px', color: '#666' }}>
        <p>API: {API_URL}</p>
        <p>Module demonstrates mapped types and template literal types patterns.</p>
      </div>
    </div>
  );
}
