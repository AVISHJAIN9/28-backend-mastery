import React, { useState, useRef } from 'react';

const API_BASE_URL = 'http://localhost:6601/api';

export default function App() {
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('health');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  const formatJson = (data) => JSON.stringify(data, null, 2);

  const handleApiCall = async (endpoint, method = 'GET', body = null) => {
    try {
      setLoading(true);
      const options = {
        method,
        headers: { 'Content-Type': 'application/json' }
      };
      if (body) options.body = JSON.stringify(body);

      const res = await fetch(`${API_BASE_URL}${endpoint}`, options);
      const data = await res.json();
      setResponse({
        status: res.status,
        statusText: res.statusText,
        data,
        timestamp: new Date().toLocaleTimeString()
      });
    } catch (error) {
      setResponse({
        status: 'ERROR',
        statusText: error.message,
        data: { error: error.message },
        timestamp: new Date().toLocaleTimeString()
      });
    } finally {
      setLoading(false);
    }
  };

  const checkHealth = () => handleApiCall('/health');

  const generateUploadUrl = async () => {
    if (!selectedFile) {
      alert('Please select a file first');
      return;
    }
    await handleApiCall('/upload/presigned-url', 'POST', {
      fileName: selectedFile.name,
      fileType: selectedFile.type,
      fileSize: selectedFile.size
    });
  };

  const uploadToS3 = async () => {
    if (!selectedFile || !response?.data?.presignedUrl) {
      alert('First generate an upload presigned URL');
      return;
    }
    try {
      setLoading(true);
      const xhr = new XMLHttpRequest();
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          setUploadProgress(Math.round((e.loaded / e.total) * 100));
        }
      });
      xhr.addEventListener('load', () => {
        setResponse({
          status: 200,
          statusText: 'File uploaded successfully to S3',
          data: { success: true, message: 'File uploaded successfully' },
          timestamp: new Date().toLocaleTimeString()
        });
      });
      xhr.addEventListener('error', () => {
        setResponse({
          status: 'ERROR',
          statusText: 'Upload failed',
          data: { error: 'File upload failed' },
          timestamp: new Date().toLocaleTimeString()
        });
      });
      xhr.open('PUT', response.data.presignedUrl);
      xhr.setRequestHeader('Content-Type', selectedFile.type);
      xhr.send(selectedFile);
    } catch (error) {
      setResponse({
        status: 'ERROR',
        statusText: error.message,
        data: { error: error.message },
        timestamp: new Date().toLocaleTimeString()
      });
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const generateDownloadUrl = () => {
    const key = prompt('Enter S3 object key:');
    if (key) handleApiCall(`/download/presigned-url/${encodeURIComponent(key)}`);
  };

  const downloadFromPresignedUrl = async () => {
    if (!response?.data?.presignedUrl) {
      alert('First generate a download presigned URL');
      return;
    }
    try {
      const a = document.createElement('a');
      a.href = response.data.presignedUrl;
      a.download = response.data.key.split('/').pop();
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      alert('Download failed: ' + error.message);
    }
  };

  const listObjects = () => handleApiCall('/objects');

  const getObjectMetadata = () => {
    const key = prompt('Enter S3 object key:');
    if (key) handleApiCall(`/objects/${encodeURIComponent(key)}/metadata`);
  };

  const deleteObject = async () => {
    const key = prompt('Enter S3 object key to delete:');
    if (key && confirm(`Sure to delete ${key}?`)) {
      await handleApiCall(`/objects/${encodeURIComponent(key)}`, 'DELETE');
    }
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1>📁 S3 Object Storage - Presigned URLs</h1>
        <p>Module 01: File Uploads & Media Storage</p>
      </header>

      <div style={styles.content}>
        <div style={styles.tabs}>
          {[
            { id: 'health', label: '🏥 Health' },
            { id: 'upload', label: '⬆️ Upload' },
            { id: 'download', label: '⬇️ Download' },
            { id: 'objects', label: '📦 Objects' }
          ].map(tab => (
            <button
              key={tab.id}
              style={{
                ...styles.tab,
                ...(activeTab === tab.id ? styles.tabActive : {})
              }}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'health' && (
          <div style={styles.tabContent}>
            <h2>Health Check</h2>
            <p>Verify connection to backend and S3</p>
            <button style={styles.button} onClick={checkHealth} disabled={loading}>
              {loading ? 'Checking...' : '🔍 Check Health'}
            </button>
          </div>
        )}

        {activeTab === 'upload' && (
          <div style={styles.tabContent}>
            <h2>Upload File</h2>
            <div style={styles.section}>
              <h3>📌 Step 1: Select File</h3>
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                style={styles.fileInput}
              />
              {selectedFile && (
                <div style={styles.fileInfo}>
                  <p><strong>File:</strong> {selectedFile.name}</p>
                  <p><strong>Type:</strong> {selectedFile.type}</p>
                  <p><strong>Size:</strong> {(selectedFile.size / 1024).toFixed(2)} KB</p>
                </div>
              )}
            </div>
            <div style={styles.section}>
              <h3>🔗 Step 2: Generate URL</h3>
              <button style={styles.button} onClick={generateUploadUrl} disabled={!selectedFile || loading}>
                {loading ? 'Generating...' : '📝 Generate Upload URL'}
              </button>
            </div>
            {response?.data?.presignedUrl && (
              <div style={styles.section}>
                <h3>📤 Step 3: Upload to S3</h3>
                <button style={styles.button} onClick={uploadToS3} disabled={loading}>
                  {loading ? `Uploading ${uploadProgress}%...` : '📤 Upload to S3'}
                </button>
                {uploadProgress > 0 && (
                  <div style={styles.progressBar}>
                    <div style={{...styles.progressFill, width: `${uploadProgress}%`}}></div>
                    <span>{uploadProgress}%</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'download' && (
          <div style={styles.tabContent}>
            <h2>Download File</h2>
            <div style={styles.section}>
              <h3>🔗 Generate Download URL</h3>
              <button style={styles.button} onClick={generateDownloadUrl} disabled={loading}>
                {loading ? 'Generating...' : '🔐 Generate Download URL'}
              </button>
              <p style={styles.helpText}>Enter the S3 key when prompted</p>
            </div>
            {response?.data?.presignedUrl && (
              <div style={styles.section}>
                <h3>⬇️ Download File</h3>
                <button style={styles.button} onClick={downloadFromPresignedUrl}>
                  ⬇️ Download
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'objects' && (
          <div style={styles.tabContent}>
            <h2>S3 Object Management</h2>
            <div style={styles.buttonGroup}>
              <button style={styles.button} onClick={listObjects} disabled={loading}>
                {loading ? 'Loading...' : '📋 List All Objects'}
              </button>
              <button style={styles.button} onClick={getObjectMetadata} disabled={loading}>
                {loading ? 'Loading...' : 'ℹ️ Get Metadata'}
              </button>
              <button style={{ ...styles.button, backgroundColor: '#dc2626' }} onClick={deleteObject} disabled={loading}>
                {loading ? 'Deleting...' : '🗑️ Delete Object'}
              </button>
            </div>
          </div>
        )}

        {response && (
          <div style={{
            ...styles.response,
            borderColor: response.status === 200 || response.status.toString().startsWith('2') ? '#16a34a' : '#dc2626'
          }}>
            <div style={styles.responseHeader}>
              <h3>{response.status === 200 || response.status.toString().startsWith('2') ? '✅' : '❌'} Response</h3>
              <span style={styles.responseTime}>{response.timestamp}</span>
            </div>
            <div style={styles.responseStatus}>
              <span style={{
                backgroundColor: response.status === 200 || response.status.toString().startsWith('2') ? '#16a34a' : '#dc2626',
                color: 'white',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '12px'
              }}>
                {response.status} {response.statusText}
              </span>
            </div>
            <pre style={styles.responseBody}>{formatJson(response.data)}</pre>
            {response.data?.presignedUrl && (
              <div style={styles.presignedUrlBox}>
                <strong>Presigned URL:</strong>
                <code style={styles.urlCode}>{response.data.presignedUrl.substring(0, 100)}...</code>
              </div>
            )}
          </div>
        )}
      </div>

      <footer style={styles.footer}>
        <p>Module 01 - S3 Object Storage with Presigned URLs</p>
        <p>Backend: http://localhost:6601 | Documentation: README.md</p>
      </footer>
    </div>
  );
}

const styles = {
  container: { minHeight: '100vh', backgroundColor: '#f3f4f6', fontFamily: 'system-ui, -apple-system, sans-serif' },
  header: { backgroundColor: '#1f2937', color: 'white', padding: '24px', textAlign: 'center', borderBottom: '4px solid #3b82f6' },
  content: { maxWidth: '1200px', margin: '24px auto', padding: '0 16px' },
  tabs: { display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' },
  tab: { padding: '12px 16px', backgroundColor: 'white', border: '1px solid #d1d5db', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '500', transition: 'all 0.3s' },
  tabActive: { backgroundColor: '#3b82f6', color: 'white', borderColor: '#3b82f6' },
  tabContent: { backgroundColor: 'white', borderRadius: '8px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  section: { marginBottom: '24px' },
  button: { padding: '12px 16px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '500', marginRight: '8px', marginBottom: '8px' },
  buttonGroup: { display: 'flex', flexWrap: 'wrap', gap: '12px' },
  fileInput: { padding: '12px', border: '2px dashed #d1d5db', borderRadius: '8px', width: '100%', cursor: 'pointer' },
  fileInfo: { marginTop: '12px', padding: '12px', backgroundColor: '#f0fdf4', borderRadius: '6px', fontSize: '14px' },
  helpText: { fontSize: '14px', color: '#6b7280', marginTop: '8px' },
  progressBar: { width: '100%', height: '24px', backgroundColor: '#e5e7eb', borderRadius: '4px', overflow: 'hidden', marginTop: '12px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  progressFill: { height: '100%', backgroundColor: '#3b82f6', transition: 'width 0.3s', position: 'absolute', left: 0, top: 0 },
  response: { marginTop: '24px', backgroundColor: 'white', border: '2px solid #16a34a', borderRadius: '8px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  responseHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
  responseTime: { fontSize: '12px', color: '#6b7280' },
  responseStatus: { marginBottom: '12px' },
  responseBody: { backgroundColor: '#f3f4f6', padding: '12px', borderRadius: '6px', overflow: 'auto', maxHeight: '400px', fontSize: '12px', fontFamily: 'monospace', marginBottom: '12px' },
  presignedUrlBox: { backgroundColor: '#fef3c7', padding: '12px', borderRadius: '6px', fontSize: '12px', wordBreak: 'break-all' },
  urlCode: { backgroundColor: '#fff7ed', padding: '4px 6px', borderRadius: '3px', fontFamily: 'monospace', fontSize: '11px' },
  footer: { textAlign: 'center', padding: '24px', color: '#6b7280', fontSize: '14px', marginTop: '48px', borderTop: '1px solid #e5e7eb' }
};
