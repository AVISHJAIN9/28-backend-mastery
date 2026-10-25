import React, { useState } from 'react';

export default function EventSourcingDemo() {
  const [aggregateId, setAggregateId] = useState('');
  const [eventType, setEventType] = useState('');
  const [eventData, setEventData] = useState('{}');
  const [result, setResult] = useState('');

  const createEvent = async () => {
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          aggregate_id: aggregateId,
          type: eventType,
          data: JSON.parse(eventData)
        })
      });
      const data = await res.json();
      setResult(JSON.stringify(data));
    } catch (err) {
      setResult(err.message);
    }
  };

  const getAggregate = async () => {
    try {
      const res = await fetch(`/api/aggregate/${aggregateId}`);
      const data = await res.json();
      setResult(JSON.stringify(data));
    } catch (err) {
      setResult(err.message);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: '40px auto', fontFamily: 'sans-serif' }}>
      <h1>Event Sourcing Demo</h1>
      <input type="text" value={aggregateId} onChange={(e) => setAggregateId(e.target.value)} placeholder="Aggregate ID" style={{ width: '100%', padding: 10, marginBottom: 10 }} />
      <input type="text" value={eventType} onChange={(e) => setEventType(e.target.value)} placeholder="Event Type" style={{ width: '100%', padding: 10, marginBottom: 10 }} />
      <textarea value={eventData} onChange={(e) => setEventData(e.target.value)} placeholder="Event Data (JSON)" style={{ width: '100%', padding: 10, marginBottom: 10, height: 100 }} />
      <button onClick={createEvent} style={{ width: '100%', padding: 10, background: '#3b82f6', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', marginBottom: 10 }}>Create Event</button>
      <button onClick={getAggregate} style={{ width: '100%', padding: 10, background: '#8b5cf6', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', marginBottom: 10 }}>Get Aggregate</button>
      <pre style={{ background: '#f0f0f0', padding: 10, marginTop: 20, borderRadius: 4 }}>{result}</pre>
    </div>
  );
}
