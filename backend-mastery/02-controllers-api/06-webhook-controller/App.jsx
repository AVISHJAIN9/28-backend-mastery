import React, { useState, useEffect } from 'react';

export default function WebhookApp() {
  const [webhooks, setWebhooks] = useState([]);
  const [url, setUrl] = useState('https://example.com/webhook');
  const [eventType, setEventType] = useState('order.created');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchWebhooks = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3000/webhooks');
      const data = await res.json();
      setWebhooks(data.webhooks || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWebhooks();
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3000/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, events: ['*'] })
      });
      if (res.ok) {
        setUrl('https://example.com/webhook');
        fetchWebhooks();
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

  const handleTrigger = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3000/webhooks/event/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventType, data: { timestamp: new Date() } })
      });
      if (res.ok) {
        const data = await res.json();
        alert(`Event triggered: ${data.summary.delivered} delivered, ${data.summary.failed} failed`);
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
      await fetch(`http://localhost:3000/webhooks/${id}`, { method: 'DELETE' });
      fetchWebhooks();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 20, fontFamily: 'sans-serif' }}>
      <h1>🪝 Webhook Controller</h1>

      {error && <div style={{ background: '#fee', color: '#c33', padding: 10, borderRadius: 4, marginBottom: 20 }}>{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        <form onSubmit={handleRegister} style={{ background: 'white', padding: 20, borderRadius: 8 }}>
          <h2>Register Webhook</h2>
          <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="URL" style={{ width: '100%', padding: 10, marginBottom: 10 }} required />
          <button type="submit" disabled={loading} style={{ padding: '10px 20px', background: '#667eea', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', width: '100%' }}>
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>

        <form onSubmit={handleTrigger} style={{ background: 'white', padding: 20, borderRadius: 8 }}>
          <h2>Trigger Event</h2>
          <input type="text" value={eventType} onChange={(e) => setEventType(e.target.value)} placeholder="Event Type" style={{ width: '100%', padding: 10, marginBottom: 10 }} />
          <button type="submit" disabled={loading} style={{ padding: '10px 20px', background: '#27ae60', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', width: '100%' }}>
            {loading ? 'Triggering...' : 'Trigger'}
          </button>
        </form>
      </div>

      <div style={{ background: 'white', padding: 20, borderRadius: 8 }}>
        <h2>Webhooks ({webhooks.length})</h2>
        <div style={{ border: '1px solid #ddd' }}>
          {webhooks.map(webhook => (
            <div key={webhook.id} style={{ padding: 15, borderBottom: '1px solid #eee' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                  <div style={{ fontWeight: 'bold' }}>{webhook.url}</div>
                  <div style={{ fontSize: '0.9em', color: '#666' }}>Events: {webhook.events.join(', ')}</div>
                  <div style={{ fontSize: '0.9em', color: '#666' }}>Success: {webhook.successCount} | Failed: {webhook.failureCount}</div>
                </div>
                <button onClick={() => handleDelete(webhook.id)} style={{ padding: '5px 10px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
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
