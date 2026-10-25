import React, { useState } from 'react';
import './App.css';

const App = () => {
  const [activeTab, setActiveTab] = useState('health');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [author, setAuthor] = useState('');
  const [invoiceNum, setInvoiceNum] = useState('');
  const [total, setTotal] = useState('');

  const API_URL = 'http://localhost:6607/api';

  const healthCheck = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/health`);
      const data = await res.json();
      setResponse(data);
    } catch (error) {
      setResponse({ error: error.message });
    }
    setLoading(false);
  };

  const generatePdf = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/pdf/template`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, author })
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'document.pdf';
      a.click();
      setResponse({ success: true, message: 'PDF downloaded' });
    } catch (error) {
      setResponse({ error: error.message });
    }
    setLoading(false);
  };

  const generateInvoice = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/pdf/invoice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceNumber: invoiceNum, items: [{ name: 'Product', price: total }], total })
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'invoice.pdf';
      a.click();
      setResponse({ success: true, message: 'Invoice downloaded' });
    } catch (error) {
      setResponse({ error: error.message });
    }
    setLoading(false);
  };

  return (
    <div className="app-container">
      <header>
        <h1>07 - PDF Generation</h1>
        <p>Generate PDFs from templates and invoices</p>
      </header>
      <div className="tabs">
        <button className={`tab-btn ${activeTab === 'health' ? 'active' : ''}`} onClick={() => setActiveTab('health')}>Health</button>
        <button className={`tab-btn ${activeTab === 'template' ? 'active' : ''}`} onClick={() => setActiveTab('template')}>Template</button>
        <button className={`tab-btn ${activeTab === 'invoice' ? 'active' : ''}`} onClick={() => setActiveTab('invoice')}>Invoice</button>
      </div>
      <div className="content">
        {activeTab === 'health' && (<div><button onClick={healthCheck} disabled={loading}>{loading ? 'Checking...' : 'Check Health'}</button></div>)}
        {activeTab === 'template' && (
          <div>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" />
            <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Content" />
            <input type="text" value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Author" />
            <button onClick={generatePdf} disabled={loading}>{loading ? 'Processing...' : 'Generate PDF'}</button>
          </div>
        )}
        {activeTab === 'invoice' && (
          <div>
            <input type="text" value={invoiceNum} onChange={(e) => setInvoiceNum(e.target.value)} placeholder="Invoice #" />
            <input type="number" value={total} onChange={(e) => setTotal(e.target.value)} placeholder="Total" />
            <button onClick={generateInvoice} disabled={loading}>{loading ? 'Processing...' : 'Generate Invoice'}</button>
          </div>
        )}
      </div>
      {response && <div className="response-box"><pre>{JSON.stringify(response, null, 2)}</pre></div>}
    </div>
  );
};

export default App;
