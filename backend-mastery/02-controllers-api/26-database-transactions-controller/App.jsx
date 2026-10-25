import React, { useState } from 'react';

export default function TransactionDemo() {
  const [fromId, setFromId] = useState('');
  const [toId, setToId] = useState('');
  const [amount, setAmount] = useState('');
  const [result, setResult] = useState('');

  const handleTransfer = async () => {
    try {
      const res = await fetch('/api/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: fromId, to: toId, amount: parseFloat(amount) })
      });
      const data = await res.json();
      setResult(JSON.stringify(data));
    } catch (err) {
      setResult(err.message);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: '40px auto', fontFamily: 'sans-serif' }}>
      <h1>Database Transaction Demo</h1>
      <input type="number" value={fromId} onChange={(e) => setFromId(e.target.value)} placeholder="From Account ID" style={{ width: '100%', padding: 10, marginBottom: 10 }} />
      <input type="number" value={toId} onChange={(e) => setToId(e.target.value)} placeholder="To Account ID" style={{ width: '100%', padding: 10, marginBottom: 10 }} />
      <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount" style={{ width: '100%', padding: 10, marginBottom: 10 }} />
      <button onClick={handleTransfer} style={{ width: '100%', padding: 10, background: '#3b82f6', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Transfer</button>
      <pre style={{ background: '#f0f0f0', padding: 10, marginTop: 20, borderRadius: 4 }}>{result}</pre>
    </div>
  );
}
