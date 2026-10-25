import React, { useState, useCallback } from 'react';

const FileUploadApp = () => {
  const [files, setFiles] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [filter, setFilter] = useState('all');

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleUpload = useCallback(async () => {
    if (files.length === 0) {
      showMessage('warning', 'Please select files');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      files.forEach(file => formData.append('files', file));

      const response = await fetch('/api/upload-multiple', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      setUploadedFiles([...data.data, ...uploadedFiles]);
      setFiles([]);
      showMessage('success', `${data.data.length} files uploaded`);
    } catch (error) {
      showMessage('error', error.message);
    } finally {
      setLoading(false);
    }
  }, [files, uploadedFiles]);

  const handleDelete = useCallback(async (id) => {
    if (!window.confirm('Delete this file?')) return;

    try {
      const response = await fetch(`/api/files/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Delete failed');

      setUploadedFiles(uploadedFiles.filter(f => f._id !== id));
      showMessage('success', 'File deleted');
    } catch (error) {
      showMessage('error', error.message);
    }
  }, [uploadedFiles]);

  const handleDownload = (id, filename) => {
    window.location.href = `/api/files/${id}/download`;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const getMimeTypeLabel = (mimetype) => {
    if (mimetype.includes('image')) return 'Image';
    if (mimetype.includes('pdf')) return 'PDF';
    if (mimetype.includes('video')) return 'Video';
    return 'Document';
  };

  const filteredFiles = filter === 'all'
    ? uploadedFiles
    : uploadedFiles.filter(f => f.mimetype.includes(filter));

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <h1>📤 File Upload Manager</h1>
      <p>Upload, manage, and organize your files</p>

      {message.text && (
        <div
          style={{
            padding: '12px 16px',
            margin: '12px 0',
            borderRadius: '4px',
            backgroundColor: message.type === 'success' ? '#d4edda' : '#f8d7da',
            color: message.type === 'success' ? '#155724' : '#721c24',
          }}
        >
          {message.text}
        </div>
      )}

      {/* Upload Section */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        style={{
          border: dragActive ? '3px dashed #007bff' : '2px dashed #ccc',
          borderRadius: '8px',
          padding: '40px',
          textAlign: 'center',
          backgroundColor: dragActive ? '#e7f3ff' : '#f9f9f9',
          marginBottom: '30px',
          cursor: 'pointer',
          transition: 'all 0.3s',
        }}
      >
        <input
          type="file"
          id="file-input"
          multiple
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
        <label htmlFor="file-input" style={{ cursor: 'pointer' }}>
          <h3>📁 Drag files here or click to select</h3>
          <p style={{ color: '#666' }}>Max 10 files, 10MB each</p>
        </label>
      </div>

      {files.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <h3>Selected Files ({files.length})</h3>
          <div style={{ display: 'grid', gap: '8px', marginBottom: '16px' }}>
            {files.map((file, idx) => (
              <div
                key={idx}
                style={{
                  padding: '12px',
                  backgroundColor: '#e7f3ff',
                  borderRadius: '4px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span>
                  {file.name} ({formatFileSize(file.size)})
                </span>
              </div>
            ))}
          </div>
          <button
            onClick={handleUpload}
            disabled={loading}
            style={{
              padding: '10px 20px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.5 : 1,
            }}
          >
            {loading ? 'Uploading...' : 'Upload Files'}
          </button>
        </div>
      )}

      {/* Filter Section */}
      <div style={{ marginBottom: '20px' }}>
        <h3>Uploaded Files ({filteredFiles.length})</h3>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
          {['all', 'image', 'pdf', 'video'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '8px 16px',
                backgroundColor: filter === f ? '#007bff' : '#f0f0f0',
                color: filter === f ? 'white' : '#000',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Files List */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
        {filteredFiles.map(file => (
          <div
            key={file._id}
            style={{
              border: '1px solid #ddd',
              borderRadius: '8px',
              padding: '16px',
              backgroundColor: '#f9f9f9',
            }}
          >
            <div style={{ marginBottom: '12px' }}>
              <span
                style={{
                  display: 'inline-block',
                  backgroundColor: '#007bff',
                  color: 'white',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  marginBottom: '8px',
                }}
              >
                {getMimeTypeLabel(file.mimetype)}
              </span>
              <p style={{ margin: '0', fontWeight: 'bold', wordBreak: 'break-word' }}>
                {file.originalname}
              </p>
              <p style={{ margin: '4px 0', color: '#666', fontSize: '12px' }}>
                {formatFileSize(file.size)}
              </p>
              <p style={{ margin: '4px 0', color: '#999', fontSize: '12px' }}>
                {new Date(file.uploadedAt).toLocaleDateString()}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => handleDownload(file._id, file.originalname)}
                style={{
                  flex: 1,
                  padding: '8px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                ⬇️ Download
              </button>
              <button
                onClick={() => handleDelete(file._id)}
                style={{
                  flex: 1,
                  padding: '8px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                🗑️ Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FileUploadApp;

