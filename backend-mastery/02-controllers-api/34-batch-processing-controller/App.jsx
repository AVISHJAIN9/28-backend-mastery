import React, { useState } from 'react';

export default function BatchProcessingDemo() {
  const [jobType, setJobType] = useState('export');
  const [jobId, setJobId] = useState('');
  const [result, setResult] = useState('');

  const submitJob = async () => {
    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: jobType })
      });
      const data = await res.json();
      setJobId(data.id);
      setResult(JSON.stringify(data));
    } catch (err) {
      setResult(err.message);
    }
  };

  const checkStatus = async () => {
    if (!jobId) return;
    try {
      const res = await fetch(`/api/jobs/${jobId}`);
      const data = await res.json();
      setResult(JSON.stringify(data));
    } catch (err) {
      setResult(err.message);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: '40px auto', fontFamily: 'sans-serif' }}>
      <h1>Batch Processing Demo</h1>
      <select value={jobType} onChange={(e) => setJobType(e.target.value)} style={{ width: '100%', padding: 10, marginBottom: 10 }}>
        <option value="export">Export Data</option>
        <option value="import">Import Data</option>
        <option value="report">Generate Report</option>
      </select>
      <button onClick={submitJob} style={{ width: '100%', padding: 10, background: '#3b82f6', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', marginBottom: 10 }}>Submit Job</button>
      <button onClick={checkStatus} style={{ width: '100%', padding: 10, background: '#8b5cf6', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', marginBottom: 10 }}>Check Status</button>
      <pre style={{ background: '#f0f0f0', padding: 10, marginTop: 20, borderRadius: 4 }}>{result}</pre>
    </div>
  );
}
