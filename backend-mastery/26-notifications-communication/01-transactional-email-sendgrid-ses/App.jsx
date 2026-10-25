import React, { useState, useEffect } from 'react';
import './App.css';

const API_BASE = 'http://localhost:4001/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('send');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  // Form states
  const [formData, setFormData] = useState({
    recipientEmail: '',
    subject: '',
    body: '',
    template: 'welcome',
    templateVariables: { userName: '', appName: '' },
    bulkEmails: '',
    metadata: {}
  });

  // Load templates on mount
  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const res = await fetch(`${API_BASE}/email/templates`);
      const data = await res.json();
      setTemplates(data.templates || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const fetchAuditLogs = async (filters = '') => {
    try {
      const res = await fetch(`${API_BASE}/email/audits${filters}`);
      const data = await res.json();
      setAuditLogs(data.data || []);
    } catch (error) {
      console.error('Error fetching logs:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleVariableChange = (key, value) => {
    setFormData(prev => ({
      ...prev,
      templateVariables: { ...prev.templateVariables, [key]: value }
    }));
  };

  const makRequest = async (endpoint, method = 'GET', body = null) => {
    setLoading(true);
    setResponse(null);

    try {
      const options = {
        method,
        headers: { 'Content-Type': 'application/json' }
      };
      if (body) options.body = JSON.stringify(body);

      const res = await fetch(`${API_BASE}${endpoint}`, options);
      const data = await res.json();

      setResponse({
        status: res.status,
        data,
        timestamp: new Date().toLocaleTimeString()
      });
    } catch (error) {
      setResponse({
        status: 'error',
        data: { error: error.message },
        timestamp: new Date().toLocaleTimeString()
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = async (e) => {
    e.preventDefault();
    await makRequest('/email/send', 'POST', {
      recipientEmail: formData.recipientEmail,
      subject: formData.subject,
      body: formData.body,
      metadata: formData.metadata
    });
  };

  const handleSendTemplate = async (e) => {
    e.preventDefault();
    await makRequest('/email/template', 'POST', {
      recipientEmail: formData.recipientEmail,
      template: formData.template,
      templateVariables: formData.templateVariables
    });
  };

  const handleBulkSend = async (e) => {
    e.preventDefault();
    const emails = formData.bulkEmails.split('\n').map(e => e.trim()).filter(Boolean);
    await makRequest('/email/bulk', 'POST', {
      emails,
      template: formData.template,
      templateVariables: formData.templateVariables
    });
  };

  return (
    <div className="app">
      <header>
        <h1>📧 Module 01: Transactional Email</h1>
        <p>SendGrid / AWS SES / Nodemailer</p>
      </header>

      <div className="container">
        <nav className="tabs">
          <button
            className={`tab ${activeTab === 'send' ? 'active' : ''}`}
            onClick={() => setActiveTab('send')}
          >
            Send Email
          </button>
          <button
            className={`tab ${activeTab === 'template' ? 'active' : ''}`}
            onClick={() => setActiveTab('template')}
          >
            Send Template
          </button>
          <button
            className={`tab ${activeTab === 'bulk' ? 'active' : ''}`}
            onClick={() => setActiveTab('bulk')}
          >
            Bulk Send
          </button>
          <button
            className={`tab ${activeTab === 'logs' ? 'active' : ''}`}
            onClick={() => { setActiveTab('logs'); fetchAuditLogs(); }}
          >
            Audit Logs
          </button>
        </nav>

        <div className="content">
          {/* Send Single Email */}
          {activeTab === 'send' && (
            <form onSubmit={handleSendEmail}>
              <h2>Send Single Email</h2>
              <div className="form-group">
                <label>Recipient Email:</label>
                <input
                  type="email"
                  name="recipientEmail"
                  value={formData.recipientEmail}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Subject:</label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Body (HTML):</label>
                <textarea
                  name="body"
                  value={formData.body}
                  onChange={handleInputChange}
                  rows="6"
                  required
                />
              </div>
              <button type="submit" disabled={loading}>
                {loading ? 'Sending...' : 'Send Email'}
              </button>
            </form>
          )}

          {/* Send from Template */}
          {activeTab === 'template' && (
            <form onSubmit={handleSendTemplate}>
              <h2>Send Template Email</h2>
              <div className="form-group">
                <label>Recipient Email:</label>
                <input
                  type="email"
                  name="recipientEmail"
                  value={formData.recipientEmail}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Template:</label>
                <select
                  name="template"
                  value={formData.template}
                  onChange={handleInputChange}
                >
                  {templates.map(t => (
                    <option key={t.key} value={t.key}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div className="template-variables">
                <h3>Template Variables</h3>
                {Object.keys(formData.templateVariables).map(key => (
                  <div key={key} className="form-group">
                    <label>{key}:</label>
                    <input
                      type="text"
                      value={formData.templateVariables[key]}
                      onChange={(e) => handleVariableChange(key, e.target.value)}
                    />
                  </div>
                ))}
              </div>
              <button type="submit" disabled={loading}>
                {loading ? 'Sending...' : 'Send Template'}
              </button>
            </form>
          )}

          {/* Bulk Send */}
          {activeTab === 'bulk' && (
            <form onSubmit={handleBulkSend}>
              <h2>Send Bulk Emails</h2>
              <div className="form-group">
                <label>Email List (one per line):</label>
                <textarea
                  name="bulkEmails"
                  value={formData.bulkEmails}
                  onChange={handleInputChange}
                  rows="6"
                  placeholder="user1@example.com&#10;user2@example.com"
                  required
                />
              </div>
              <div className="form-group">
                <label>Template:</label>
                <select
                  name="template"
                  value={formData.template}
                  onChange={handleInputChange}
                >
                  {templates.map(t => (
                    <option key={t.key} value={t.key}>{t.name}</option>
                  ))}
                </select>
              </div>
              <button type="submit" disabled={loading}>
                {loading ? 'Sending...' : 'Send Bulk Emails'}
              </button>
            </form>
          )}

          {/* Audit Logs */}
          {activeTab === 'logs' && (
            <div>
              <h2>Email Audit Logs</h2>
              <div className="log-filters">
                <button onClick={() => fetchAuditLogs()}>All</button>
                <button onClick={() => fetchAuditLogs('?status=sent')}>Sent</button>
                <button onClick={() => fetchAuditLogs('?status=failed')}>Failed</button>
              </div>
              {auditLogs.length === 0 ? (
                <p className="no-data">No logs found</p>
              ) : (
                <div className="logs-table">
                  <table>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Email</th>
                        <th>Template</th>
                        <th>Status</th>
                        <th>Sent At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditLogs.map(log => (
                        <tr key={log.id}>
                          <td>{log.id}</td>
                          <td>{log.recipientEmail}</td>
                          <td>{log.template}</td>
                          <td className={`status-${log.status}`}>{log.status}</td>
                          <td>{new Date(log.sentAt).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Response Display */}
        {response && (
          <div className={`response ${response.status < 400 || response.status === 207 ? 'success' : 'error'}`}>
            <h3>Response ({response.timestamp})</h3>
            <pre>{JSON.stringify(response.data, null, 2)}</pre>
          </div>
        )}
      </div>

      <style jsx>{`
        .app {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto;
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          background: #f5f5f5;
        }

        header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 40px;
          border-radius: 12px;
          margin-bottom: 30px;
          text-align: center;
        }

        header h1 {
          margin: 0;
          font-size: 2.5em;
        }

        header p {
          margin: 10px 0 0 0;
          opacity: 0.9;
        }

        .container {
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.1);
          overflow: hidden;
        }

        .tabs {
          display: flex;
          border-bottom: 2px solid #eee;
        }

        .tab {
          flex: 1;
          padding: 16px;
          border: none;
          background: none;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          color: #666;
          border-bottom: 3px solid transparent;
          transition: all 0.3s;
        }

        .tab.active {
          color: #667eea;
          border-bottom-color: #667eea;
        }

        .tab:hover {
          background: #f9f9f9;
        }

        .content {
          padding: 30px;
        }

        form h2 {
          margin-top: 0;
          color: #333;
        }

        .form-group {
          margin-bottom: 20px;
        }

        label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
          color: #333;
        }

        input, textarea, select {
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-family: inherit;
          font-size: 14px;
        }

        input:focus, textarea:focus, select:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        button {
          padding: 12px 24px;
          background: #667eea;
          color: white;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }

        button:hover:not(:disabled) {
          background: #5568d3;
          transform: translateY(-2px);
        }

        button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .template-variables {
          background: #f9f9f9;
          padding: 15px;
          border-radius: 6px;
          margin: 20px 0;
        }

        .log-filters {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
        }

        .log-filters button {
          padding: 8px 16px;
          font-size: 14px;
        }

        .logs-table {
          overflow-x: auto;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
        }

        th {
          background: #f5f5f5;
          padding: 12px;
          text-align: left;
          font-weight: 600;
          color: #333;
          border-bottom: 2px solid #ddd;
        }

        td {
          padding: 12px;
          border-bottom: 1px solid #eee;
        }

        tr:hover {
          background: #f9f9f9;
        }

        .status-sent {
          color: #22a946;
          font-weight: 600;
        }

        .status-failed {
          color: #cb2431;
          font-weight: 600;
        }

        .status-pending {
          color: #ffc72b;
          font-weight: 600;
        }

        .no-data {
          text-align: center;
          padding: 40px;
          color: #999;
        }

        .response {
          margin-top: 30px;
          padding: 20px;
          border-radius: 6px;
          border-left: 4px solid #ddd;
        }

        .response.success {
          background: #f0f9ff;
          border-left-color: #22a946;
        }

        .response.error {
          background: #fff5f5;
          border-left-color: #cb2431;
        }

        .response h3 {
          margin-top: 0;
          color: #333;
        }

        .response pre {
          background: white;
          padding: 15px;
          border-radius: 4px;
          overflow-x: auto;
          font-size: 12px;
        }
      `}</style>
    </div>
  );
}

