import React, { useState } from 'react';
import './App.css';

const API_BASE = 'http://localhost:6303';

function App() {
  const [activeTab, setActiveTab] = useState('auth');
  const [token, setToken] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [response, setResponse] = useState(null);
  const [documentTitle, setDocumentTitle] = useState('');
  const [documentContent, setDocumentContent] = useState('');
  const [documents, setDocuments] = useState([]);
  const [fileName, setFileName] = useState('');
  const [files, setFiles] = useState([]);

  const callAPI = async (path, method = 'GET', body = null) => {
    try {
      const options = {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: body ? JSON.stringify(body) : undefined,
      };

      const res = await fetch(`${API_BASE}${path}`, options);
      const data = await res.json();
      setResponse(data);
      return data;
    } catch (error) {
      setResponse({ error: error.message });
    }
  };

  const handleRegister = async () => {
    const data = await callAPI('/auth/register', 'POST', {
      email,
      password,
      displayName,
    });
    if (data.uid) {
      alert('Registration successful!');
      setEmail('');
      setPassword('');
      setDisplayName('');
    }
  };

  const handleLogin = async () => {
    const data = await callAPI('/auth/login', 'POST', { email, password });
    if (data.token) {
      setToken(data.token);
      setPassword('');
      alert('Login successful!');
    }
  };

  const handleLogout = () => {
    setToken(null);
    setEmail('');
    setPassword('');
    setResponse(null);
  };

  const handleGetProfile = async () => {
    await callAPI('/profile');
  };

  const handleCreateDocument = async () => {
    const data = await callAPI('/documents', 'POST', {
      title: documentTitle,
      content: documentContent,
      docType: 'document',
    });
    if (data.success) {
      setDocumentTitle('');
      setDocumentContent('');
      handleListDocuments();
    }
  };

  const handleListDocuments = async () => {
    const data = await callAPI('/documents');
    if (data.documents) setDocuments(data.documents);
  };

  const handleDeleteDocument = async (docId) => {
    await callAPI(`/documents/${docId}`, 'DELETE');
    handleListDocuments();
  };

  const handleUploadFile = async () => {
    const data = await callAPI('/files/upload', 'POST', {
      fileName,
      contentType: 'application/octet-stream',
    });
    if (data.success) {
      setFileName('');
      handleListFiles();
    }
  };

  const handleListFiles = async () => {
    const data = await callAPI('/files');
    if (data.files) setFiles(data.files);
  };

  const handleDeleteFile = async (fileId) => {
    await callAPI(`/files/${fileId}`, 'DELETE');
    handleListFiles();
  };

  return (
    <div className="app">
      <header className="header">
        <h1>🔐 Firebase Auth & Storage</h1>
        <div className="status">
          {token ? (
            <span className="logged-in">✅ Authenticated</span>
          ) : (
            <span className="logged-out">🔓 Not Authenticated</span>
          )}
        </div>
      </header>

      {!token ? (
        <div className="auth-container">
          <h2>Authentication</h2>
          <div className="form-group">
            <label>Email:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
            />
          </div>
          <div className="form-group">
            <label>Password:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="min 8 characters"
            />
          </div>
          <div className="form-group">
            <label>Display Name (Register only):</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
            />
          </div>
          <div className="button-group">
            <button onClick={handleRegister} className="btn-primary">
              📝 Register
            </button>
            <button onClick={handleLogin} className="btn-success">
              🔓 Login
            </button>
          </div>
        </div>
      ) : (
        <div className="main-container">
          <div className="tabs">
            <button
              className={`tab ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              👤 Profile
            </button>
            <button
              className={`tab ${activeTab === 'documents' ? 'active' : ''}`}
              onClick={() => setActiveTab('documents')}
            >
              📄 Documents
            </button>
            <button
              className={`tab ${activeTab === 'files' ? 'active' : ''}`}
              onClick={() => setActiveTab('files')}
            >
              📁 Files
            </button>
            <button onClick={handleLogout} className="btn-danger logout-btn">
              🚪 Logout
            </button>
          </div>

          {activeTab === 'profile' && (
            <div className="tab-content">
              <h2>Profile</h2>
              <button onClick={handleGetProfile} className="btn-primary">
                Get Profile
              </button>
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="tab-content">
              <h2>Documents</h2>
              <div className="form-group">
                <label>Title:</label>
                <input
                  type="text"
                  value={documentTitle}
                  onChange={(e) => setDocumentTitle(e.target.value)}
                  placeholder="Document title"
                />
              </div>
              <div className="form-group">
                <label>Content:</label>
                <textarea
                  value={documentContent}
                  onChange={(e) => setDocumentContent(e.target.value)}
                  placeholder="Document content"
                  rows="4"
                />
              </div>
              <div className="button-group">
                <button onClick={handleCreateDocument} className="btn-primary">
                  ➕ Create
                </button>
                <button onClick={handleListDocuments} className="btn-info">
                  📋 List
                </button>
              </div>
              {documents.length > 0 && (
                <div className="list">
                  <h3>Your Documents</h3>
                  {documents.map((doc) => (
                    <div key={doc.id} className="item">
                      <span>{doc.title}</span>
                      <button
                        onClick={() => handleDeleteDocument(doc.id)}
                        className="btn-danger-small"
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'files' && (
            <div className="tab-content">
              <h2>File Storage</h2>
              <div className="form-group">
                <label>File Name:</label>
                <input
                  type="text"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  placeholder="example.pdf"
                />
              </div>
              <div className="button-group">
                <button onClick={handleUploadFile} className="btn-primary">
                  📤 Upload
                </button>
                <button onClick={handleListFiles} className="btn-info">
                  📋 List
                </button>
              </div>
              {files.length > 0 && (
                <div className="list">
                  <h3>Your Files</h3>
                  {files.map((file) => (
                    <div key={file.id} className="item">
                      <span>{file.fileName}</span>
                      <button
                        onClick={() => handleDeleteFile(file.id)}
                        className="btn-danger-small"
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {response && (
        <div className="response-panel">
          <h3>API Response</h3>
          <pre>{JSON.stringify(response, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

export default App;

