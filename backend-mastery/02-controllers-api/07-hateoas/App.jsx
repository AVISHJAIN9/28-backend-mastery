import React, { useState, useEffect } from 'react';

export default function HateoasApp() {
  const [items, setItems] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3000/hateoas');
      const data = await res.json();
      setItems(data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      const res = await fetch('http://localhost:3000/hateoas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description })
      });
      if (res.ok) {
        setName('');
        setDescription('');
        fetchItems();
      } else {
        const data = await res.json();
        setError(data.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:3000/hateoas/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchItems();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewLinks = async (item) => {
    setSelectedItem(item);
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: 20, fontFamily: 'sans-serif' }}>
      <h1>🔗 HATEOAS Controller</h1>

      {error && <div style={{ background: '#fee', color: '#c33', padding: 10, borderRadius: 4, marginBottom: 20 }}>{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        <form onSubmit={handleCreate} style={{ background: 'white', padding: 20, borderRadius: 8 }}>
          <h2>Create Resource</h2>
          <input 
            type="text" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            placeholder="Name" 
            style={{ width: '100%', padding: 10, marginBottom: 10 }} 
            required 
          />
          <textarea 
            value={description} 
            onChange={(e) => setDescription(e.target.value)} 
            placeholder="Description" 
            style={{ width: '100%', padding: 10, marginBottom: 10, height: 80 }} 
          />
          <button 
            type="submit" 
            disabled={loading} 
            style={{ padding: '10px 20px', background: '#667eea', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', width: '100%' }}
          >
            {loading ? 'Creating...' : 'Create'}
          </button>
        </form>

        {selectedItem && (
          <div style={{ background: '#f0f5ff', padding: 20, borderRadius: 8, overflowY: 'auto', maxHeight: 400 }}>
            <h2>Available Links</h2>
            <div style={{ fontSize: '0.9em' }}>
              <p><strong>Resource:</strong> {selectedItem.name}</p>
              <p><strong>Links:</strong></p>
              <pre style={{ background: 'white', padding: 10, borderRadius: 4, overflow: 'auto' }}>
                {JSON.stringify(selectedItem._links, null, 2)}
              </pre>
              <p><strong>Actions:</strong></p>
              <pre style={{ background: 'white', padding: 10, borderRadius: 4, overflow: 'auto' }}>
                {JSON.stringify(selectedItem._actions, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>

      <div style={{ background: 'white', padding: 20, borderRadius: 8 }}>
        <h2>Resources ({items.length})</h2>
        <div style={{ border: '1px solid #ddd' }}>
          {items.map(item => (
            <div key={item.id} style={{ padding: 15, borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 'bold' }}>{item.name}</div>
                <div style={{ fontSize: '0.9em', color: '#666' }}>{item.description}</div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button 
                  onClick={() => handleViewLinks(item)} 
                  style={{ padding: '5px 10px', background: '#667eea', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                >
                  Links
                </button>
                <button 
                  onClick={() => handleDelete(item.id)} 
                  style={{ padding: '5px 10px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
