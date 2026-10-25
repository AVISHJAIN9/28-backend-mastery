import React, { useState } from 'react';
import './App.css';
function App() {
  const [entries, setEntries] = useState([]);
  const [formData, setFormData] = useState({ account: '', debit: 0, credit: 0, description: '' });
  const [journalEntries, setJournalEntries] = useState([]);
  const [response, setResponse] = useState(null);
  const API_URL = 'http://localhost:6103/api';

  const addEntry = () => {
    if (formData.account) {
      setEntries([...entries, { ...formData, debit: parseFloat(formData.debit) || 0, credit: parseFloat(formData.credit) || 0 }]);
      setFormData({ account: '', debit: 0, credit: 0, description: '' });
    }
  };

  const submitJournalEntry = async () => {
    if (entries.length < 2) {
      setResponse({ error: 'Need at least 2 entries' });
      return;
    }
    try {
      const debits = entries.reduce((s, e) => s + e.debit, 0);
      const credits = entries.reduce((s, e) => s + e.credit, 0);
      const res = await fetch(`${API_URL}/journal-entries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries, description: formData.description })
      });
      const data = await res.json();
      setResponse(data);
      setJournalEntries([...journalEntries, data]);
      setEntries([]);
    } catch (error) {
      setResponse({ error: error.message });
    }
  };

  const totalDebits = entries.reduce((s, e) => s + e.debit, 0);
  const totalCredits = entries.reduce((s, e) => s + e.credit, 0);
  const balanced = totalDebits === totalCredits;

  return (
    <div className="app-container">
      <header className="header"><h1>📊 Double Entry Bookkeeping</h1><p>Every debit must have a credit</p></header>
      <div className="main-content">
        <section className="section">
          <h2>Add Journal Entry</h2>
          <div className="form-group">
            <input type="text" placeholder="Account Name" value={formData.account} onChange={(e) => setFormData({ ...formData, account: e.target.value })} />
            <input type="number" placeholder="Debit" value={formData.debit} onChange={(e) => setFormData({ ...formData, debit: e.target.value })} />
            <input type="number" placeholder="Credit" value={formData.credit} onChange={(e) => setFormData({ ...formData, credit: e.target.value })} />
            <button onClick={addEntry}>Add Entry</button>
          </div>
        </section>
        <section className="section">
          <h2>Current Entry ({entries.length} lines)</h2>
          <p style={{color: balanced? 'green':'red'}}>{balanced ? '✓ Balanced' : '✗ Out of Balance'}</p>
          <p>Debits: ${totalDebits.toFixed(2)} | Credits: ${totalCredits.toFixed(2)}</p>
          <table className="data-table">
            <thead><tr><th>Account</th><th>Debit</th><th>Credit</th></tr></thead>
            <tbody>
              {entries.map((e, i) => (<tr key={i}><td>{e.account}</td><td>${e.debit}</td><td>${e.credit}</td></tr>))}
            </tbody>
          </table>
          <button onClick={submitJournalEntry} disabled={!balanced}>Submit Journal Entry</button>
        </section>
        {response && <section className="section response-section"><h2>Response</h2><pre>{JSON.stringify(response, null, 2)}</pre></section>}
      </div>
    </div>
  );
}
export default App;
