
import React, { useState, useEffect } from 'react';

const App = () => {
  const [items, setItems] = useState([]);
  const [formData, setFormData] = useState({ name: '', description: '', value: '' });
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const API_URL = 'http://localhost:3007/api';

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const res = await fetch(API_URL + '/items');
      const data = await res.json();
      setItems(data.items || []);
    } catch (error) {
      setResponse({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.name) {
      setResponse({ error: 'Name is required' });
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(API_URL + '/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      setResponse(data);
      if (data.success) {
        setFormData({ name: '', description: '', value: '' });
        fetchItems();
      }
    } catch (error) {
      setResponse({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete item?')) return;
    try {
      setLoading(true);
      const res = await fetch(API_URL + '/items/' + id, { method: 'DELETE' });
      const data = await res.json();
      setResponse(data);
      fetchItems();
    } catch (error) {
      setResponse({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px', fontFamily: 'Arial' }}>
      <h1>🎯 Command Pattern Demo</h1>
      <p>Testing the Command pattern implementation</p>

      <form onSubmit={handleCreate} style={{ marginBottom: '20px', padding: '15px', background: '#f8f9fa', borderRadius: '4px' }}>
        <h3>Create Item</h3>
        <div style={{ marginBottom: '10px' }}>
          <label>Name:</label>
          <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} style={{ marginLeft: '10px', width: '300px', padding: '5px' }} placeholder="Item name" />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Description:</label>
          <input type="text" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} style={{ marginLeft: '10px', width: '300px', padding: '5px' }} placeholder="Description" />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Value:</label>
          <input type="text" value={formData.value} onChange={(e) => setFormData({ ...formData, value: e.target.value })} style={{ marginLeft: '10px', width: '300px', padding: '5px' }} placeholder="Value" />
        </div>
        <button type="submit" style={{ padding: '8px 16px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }} disabled={loading}>
          {loading ? 'Creating...' : 'Create Item'}
        </button>
      </form>

      <h3>Items ({items.length})</h3>
      {items.length > 0 ? (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#007bff', color: 'white' }}>
              <th style={{ padding: '10px', textAlign: 'left' }}>ID</th>
              <th style={{ padding: '10px', textAlign: 'left' }}>Name</th>
              <th style={{ padding: '10px', textAlign: 'left' }}>Description</th>
              <th style={{ padding: '10px', textAlign: 'left' }}>Value</th>
              <th style={{ padding: '10px', textAlign: 'left' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '10px' }}>{item.id}</td>
                <td style={{ padding: '10px' }}>{item.name}</td>
                <td style={{ padding: '10px' }}>{item.description}</td>
                <td style={{ padding: '10px' }}>{item.value}</td>
                <td style={{ padding: '10px' }}>
                  <button onClick={() => handleDelete(item.id)} style={{ background: '#dc3545', color: 'white', padding: '4px 8px', border: 'none', cursor: 'pointer' }}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No items yet. Create your first item!</p>
      )}

      {response && (
        <div style={{ marginTop: '20px', padding: '15px', background: response.success ? '#d4edda' : '#f8d7da', color: response.success ? '#155724' : '#721c24', borderRadius: '4px' }}>
          <h4>{response.success ? '✓ Success' : '✗ Error'}</h4>
          <pre style={{ background: 'white', padding: '10px', borderRadius: '4px', overflowX: 'auto', maxHeight: '200px' }}>{JSON.stringify(response, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default App;
