import React, { useState, useRef, useEffect } from 'react';

const API_BASE = 'http://localhost:6602';
const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Chunked Upload Component
 * Features:
 * - File selection and validation
 * - Real-time progress tracking
 * - Chunk-by-chunk progress visualization
 * - Resume capability with localStorage
 * - Error recovery with retry
 */
const App = () => {
  // ==================== STATE ====================

  const fileInput = useRef(null);
  const [file, setFile] = useState(null);
  const [uploadId, setUploadId] = useState(null);
  const [status, setStatus] = useState('idle'); // idle, initiating, uploading, completing, completed, error, paused
  const [progress, setProgress] = useState(0); // 0-100
  const [uploadedChunks, setUploadedChunks] = useState(new Map());
  const [totalChunks, setTotalChunks] = useState(0);
  const [currentChunk, setCurrentChunk] = useState(0);
  const [message, setMessage] = useState('');
  const [error, setError] = useState(null);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const abortController = useRef(null);

  // ==================== LIFECYCLE ====================

  useEffect(() => {
    // Check for resumed upload on mount
    checkForResumedUpload();
  }, []);

  // ==================== EVENT HANDLERS ====================

  const handleFileSelect = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      // Validate file size (max 1GB)
      if (selectedFile.size > 1073741824) {
        setError('File size exceeds 1GB limit');
        return;
      }

      setFile(selectedFile);
      setError(null);
      setProgress(0);
      setStatus('idle');
      setUploadedChunks(new Map());
      setDownloadUrl(null);
    }
  };

  const handleUploadStart = async () => {
    if (!file) {
      setError('No file selected');
      return;
    }

    abortController.current = new AbortController();
    setStatus('initiating');
    setMessage('Initiating multipart upload...');
    setError(null);

    try {
      // Step 1: Initiate multipart upload
      const response = await fetch(`${API_BASE}/api/initiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          fileSize: file.size,
          mimeType: file.type || 'application/octet-stream'
        })
      });

      if (!response.ok) {
        throw new Error(`Initiation failed: ${response.statusText}`);
      }

      const data = await response.json();
      const newUploadId = data.uploadId;

      setUploadId(newUploadId);
      setTotalChunks(data.totalChunks);

      // Save to localStorage for resume
      localStorage.setItem('uploadId', newUploadId);
      localStorage.setItem('fileName', file.name);
      localStorage.setItem('fileSize', file.size);

      setStatus('uploading');
      setMessage('Uploading chunks...');

      // Step 2: Upload chunks
      await uploadChunksSequential(file, newUploadId);
    } catch (err) {
      setStatus('error');
      setError(err.message);
      setMessage('Upload failed');
    }
  };

  const handlePause = () => {
    if (abortController.current) {
      abortController.current.abort();
    }
    setIsPaused(true);
    setStatus('paused');
    setMessage('Upload paused. You can resume later.');
  };

  const handleResume = async () => {
    if (!uploadId) {
      setError('No upload ID to resume');
      return;
    }

    setIsPaused(false);
    setStatus('uploading');
    setMessage('Resuming upload...');
    setError(null);
    abortController.current = new AbortController();

    try {
      // Query server for status
      const response = await fetch(`${API_BASE}/api/list-chunks?uploadId=${uploadId}`);
      if (!response.ok) {
        throw new Error('Failed to get upload status');
      }

      const data = await response.json();
      const uploadedChunkNums = new Set(data.chunks.map(c => c.chunkNumber));

      // Update uploadedChunks map
      const newUploadedChunks = new Map();
      data.chunks.forEach(chunk => {
        newUploadedChunks.set(chunk.chunkNumber, { etag: chunk.etag });
      });
      setUploadedChunks(newUploadedChunks);

      setCurrentChunk(Math.max(...uploadedChunkNums) + 1);
      setProgress(Math.round((uploadedChunkNums.size / totalChunks) * 100));

      // Continue uploading from next chunk
      await uploadChunksFromIndex(file, uploadId, [...uploadedChunkNums].sort((a, b) => a - b));
    } catch (err) {
      setStatus('error');
      setError(err.message);
    }
  };

  const handleAbort = async () => {
    if (abortController.current) {
      abortController.current.abort();
    }

    if (uploadId) {
      try {
        await fetch(`${API_BASE}/api/abort-upload`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uploadId })
        });
      } catch (err) {
        console.error('Abort failed:', err);
      }
    }

    // Clear localStorage
    localStorage.removeItem('uploadId');
    localStorage.removeItem('fileName');
    localStorage.removeItem('fileSize');

    // Reset state
    setFile(null);
    setUploadId(null);
    setStatus('idle');
    setProgress(0);
    setUploadedChunks(new Map());
    setDownloadUrl(null);
    setMessage('Upload cancelled');
    setIsPaused(false);
  };

  // ==================== UPLOAD LOGIC ====================

  const uploadChunksSequential = async (file, uploadId) => {
    const chunks = generateChunks(file);
    const uploadedChunkMap = new Map();

    try {
      for (let chunkNumber = 1; chunkNumber <= chunks.length; chunkNumber++) {
        if (abortController.current?.signal.aborted) {
          setMessage('Upload paused');
          return;
        }

        setCurrentChunk(chunkNumber);
        const chunk = chunks[chunkNumber - 1];

        try {
          const etag = await uploadChunk(uploadId, chunkNumber, chunk);
          uploadedChunkMap.set(chunkNumber, { etag });
          setUploadedChunks(new Map(uploadedChunkMap));

          const progressPercent = Math.round((chunkNumber / chunks.length) * 100);
          setProgress(progressPercent);
          setMessage(`Uploaded ${chunkNumber}/${chunks.length} chunks`);
        } catch (err) {
          setError(`Chunk ${chunkNumber} upload failed: ${err.message}`);
          setStatus('error');
          throw err;
        }
      }

      // All chunks uploaded, complete the upload
      await completeUpload(uploadId, uploadedChunkMap);
    } catch (err) {
      console.error('Upload failed:', err);
    }
  };

  const uploadChunksFromIndex = async (file, uploadId, uploadedChunkNums) => {
    const chunks = generateChunks(file);
    const uploadedChunkMap = new Map(uploadedChunks);

    try {
      for (let chunkNumber = 1; chunkNumber <= chunks.length; chunkNumber++) {
        if (abortController.current?.signal.aborted) {
          setMessage('Upload paused');
          return;
        }

        // Skip already uploaded chunks
        if (uploadedChunkNums.includes(chunkNumber)) {
          continue;
        }

        setCurrentChunk(chunkNumber);
        const chunk = chunks[chunkNumber - 1];

        try {
          const etag = await uploadChunk(uploadId, chunkNumber, chunk);
          uploadedChunkMap.set(chunkNumber, { etag });
          setUploadedChunks(new Map(uploadedChunkMap));

          const progressPercent = Math.round((uploadedChunkMap.size / chunks.length) * 100);
          setProgress(progressPercent);
          setMessage(`Uploaded ${uploadedChunkMap.size}/${chunks.length} chunks`);
        } catch (err) {
          setError(`Chunk ${chunkNumber} upload failed: ${err.message}`);
          setStatus('error');
          throw err;
        }
      }

      // All chunks uploaded, complete the upload
      await completeUpload(uploadId, uploadedChunkMap);
    } catch (err) {
      console.error('Upload failed:', err);
    }
  };

  const uploadChunk = async (uploadId, chunkNumber, chunk) => {
    const params = new URLSearchParams({
      uploadId,
      chunkNumber
    });

    const response = await fetch(`${API_BASE}/api/upload-chunk?${params}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/octet-stream' },
      body: chunk,
      signal: abortController.current?.signal
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Chunk upload failed');
    }

    const data = await response.json();
    return data.etag;
  };

  const completeUpload = async (uploadId, uploadedChunkMap) => {
    setStatus('completing');
    setMessage('Finalizing upload...');

    try {
      const chunks = Array.from(uploadedChunkMap.entries())
        .map(([chunkNumber, data]) => ({
          chunkNumber,
          etag: data.etag
        }))
        .sort((a, b) => a.chunkNumber - b.chunkNumber);

      const response = await fetch(`${API_BASE}/api/complete-upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uploadId, chunks })
      });

      if (!response.ok) {
        throw new Error('Upload completion failed');
      }

      const data = await response.json();
      setDownloadUrl(data.downloadUrl);
      setStatus('completed');
      setProgress(100);
      setMessage('Upload completed successfully!');

      // Clear localStorage
      localStorage.removeItem('uploadId');
      localStorage.removeItem('fileName');
      localStorage.removeItem('fileSize');
    } catch (err) {
      setStatus('error');
      setError(err.message);
      setMessage('Failed to complete upload');
    }
  };

  // ==================== UTILITY FUNCTIONS ====================

  const generateChunks = (file) => {
    const chunks = [];
    let offset = 0;

    while (offset < file.size) {
      const chunkEnd = Math.min(offset + CHUNK_SIZE, file.size);
      chunks.push(file.slice(offset, chunkEnd));
      offset = chunkEnd;
    }

    return chunks;
  };

  const checkForResumedUpload = () => {
    const savedUploadId = localStorage.getItem('uploadId');
    const savedFileName = localStorage.getItem('fileName');

    if (savedUploadId && savedFileName) {
      setUploadId(savedUploadId);
      setMessage(`Found incomplete upload: ${savedFileName}`);
      setStatus('paused');
      setIsPaused(true);
    }
  };

  const formatFileSize = (bytes) => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  };

  const downloadFile = () => {
    if (downloadUrl) {
      window.open(downloadUrl, '_blank');
    }
  };

  // ==================== RENDER ====================

  return (
    <div style={styles.container}>
      <style>{`
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          margin: 0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          padding: 20px;
        }
      `}</style>

      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>📤 Chunked Upload Demo</h1>
        <p style={styles.subtitle}>
          Module 02: Chunked Uploads with Multipart Resume
        </p>
      </div>

      {/* Main Card */}
      <div style={styles.card}>
        {/* File Selection */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>1. Select File</h2>
          <input
            ref={fileInput}
            type="file"
            onChange={handleFileSelect}
            disabled={status === 'uploading' || status === 'completing'}
            style={styles.fileInput}
            accept="*/*"
          />
          {file && (
            <div style={styles.fileInfo}>
              <p>
                <strong>File:</strong> {file.name}
              </p>
              <p>
                <strong>Size:</strong> {formatFileSize(file.size)}
              </p>
              <p>
                <strong>Type:</strong> {file.type || 'unknown'}
              </p>
              {totalChunks > 0 && (
                <p>
                  <strong>Chunks:</strong> {totalChunks} × {formatFileSize(CHUNK_SIZE)}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Upload Progress */}
        {(status === 'uploading' || status === 'completing' || status === 'completed' || status === 'paused') && (
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>2. Upload Progress</h2>

            {/* Main Progress Bar */}
            <div style={styles.progressContainer}>
              <div style={styles.progressBg}>
                <div
                  style={{
                    ...styles.progressBar,
                    width: `${progress}%`
                  }}
                />
              </div>
              <p style={styles.progressText}>{progress}%</p>
            </div>

            {/* Status Info */}
            <div style={styles.statusInfo}>
              <p>
                <strong>Status:</strong> {status.toUpperCase()}
              </p>
              <p>
                <strong>Current Chunk:</strong> {currentChunk}/{totalChunks}
              </p>
              <p>
                <strong>Uploaded Chunks:</strong> {uploadedChunks.size}/{totalChunks}
              </p>
              {message && <p style={styles.message}>{message}</p>}
            </div>

            {/* Chunk Visualization */}
            <div style={styles.chunkVisualization}>
              <p style={styles.chunkLabel}>Chunk Status:</p>
              <div style={styles.chunkGrid}>
                {Array.from({ length: totalChunks }).map((_, index) => {
                  const chunkNum = index + 1;
                  const isUploaded = uploadedChunks.has(chunkNum);
                  const isCurrent = chunkNum === currentChunk;

                  return (
                    <div
                      key={chunkNum}
                      title={`Chunk ${chunkNum}`}
                      style={{
                        ...styles.chunk,
                        backgroundColor: isUploaded
                          ? '#10b981'
                          : isCurrent
                          ? '#f59e0b'
                          : '#e5e7eb'
                      }}
                    />
                  );
                })}
              </div>
              <p style={styles.chunkLegend}>
                <span style={{ ...styles.legend, color: '#10b981' }}>■</span> Uploaded{' '}
                <span style={{ ...styles.legend, color: '#f59e0b' }}>■</span> In Progress{' '}
                <span style={{ ...styles.legend, color: '#e5e7eb' }}>■</span> Pending
              </p>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div style={styles.errorBox}>
            <p style={styles.errorTitle}>❌ Error</p>
            <p style={styles.errorMessage}>{error}</p>
          </div>
        )}

        {/* Completed */}
        {status === 'completed' && (
          <div style={styles.successBox}>
            <p style={styles.successTitle}>✅ Upload Completed!</p>
            <p>Your file has been successfully uploaded to S3.</p>
            {downloadUrl && (
              <button onClick={downloadFile} style={styles.downloadButton}>
                📥 Download File
              </button>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>3. Actions</h2>
          <div style={styles.buttonGroup}>
            {status === 'idle' && (
              <button onClick={handleUploadStart} style={styles.primaryButton} disabled={!file}>
                🚀 Start Upload
              </button>
            )}

            {status === 'uploading' && (
              <button onClick={handlePause} style={styles.secondaryButton}>
                ⏸️ Pause
              </button>
            )}

            {status === 'paused' && (
              <>
                <button onClick={handleResume} style={styles.primaryButton}>
                  ▶️ Resume Upload
                </button>
                <button onClick={handleAbort} style={styles.dangerButton}>
                  ✕ Cancel Upload
                </button>
              </>
            )}

            {(status === 'completing' || status === 'error') && (
              <button onClick={handleAbort} style={styles.dangerButton}>
                ✕ Cancel
              </button>
            )}

            {status === 'completed' && (
              <button onClick={handleAbort} style={styles.secondaryButton}>
                🔄 Start New Upload
              </button>
            )}
          </div>
        </div>

        {/* Info Box */}
        <div style={styles.infoBox}>
          <p>
            <strong>💡 About this demo:</strong>
          </p>
          <ul>
            <li>Files are split into 5MB chunks</li>
            <li>Upload can be paused and resumed</li>
            <li>Progress is tracked per chunk</li>
            <li>Each chunk is uploaded to AWS S3</li>
            <li>Resume data is stored in browser localStorage</li>
            <li>Max file size: 1GB</li>
          </ul>
        </div>
      </div>

      {/* Footer */}
      <div style={styles.footer}>
        <p>Backend Mastery | 25 File Media Storage | Module 02</p>
        <p>Production-ready chunked uploads with multipart resume</p>
      </div>
    </div>
  );
};

// ==================== STYLES ====================

const styles = {
  container: {
    maxWidth: '900px',
    margin: '0 auto',
    padding: '20px'
  },
  header: {
    textAlign: 'center',
    color: 'white',
    marginBottom: '40px'
  },
  title: {
    fontSize: '32px',
    margin: '0 0 10px 0'
  },
  subtitle: {
    fontSize: '16px',
    margin: '0',
    opacity: 0.9
  },
  card: {
    background: 'white',
    borderRadius: '12px',
    padding: '40px',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
    marginBottom: '40px'
  },
  section: {
    marginBottom: '30px'
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: '600',
    marginBottom: '15px',
    color: '#1f2937'
  },
  fileInput: {
    padding: '12px',
    border: '2px dashed #667eea',
    borderRadius: '8px',
    width: '100%',
    boxSizing: 'border-box',
    cursor: 'pointer'
  },
  fileInfo: {
    marginTop: '15px',
    padding: '15px',
    background: '#f3f4f6',
    borderRadius: '8px'
  },
  fileInfo: {
    marginTop: '15px',
    padding: '15px',
    background: '#f3f4f6',
    borderRadius: '8px',
    fontSize: '14px'
  },
  fileInfo: {
    marginTop: '15px',
    padding: '15px',
    background: '#f3f4f6',
    borderRadius: '8px',
    fontSize: '14px'
  },
  progressContainer: {
    marginBottom: '20px'
  },
  progressBg: {
    width: '100%',
    height: '8px',
    background: '#e5e7eb',
    borderRadius: '4px',
    overflow: 'hidden',
    marginBottom: '10px'
  },
  progressBar: {
    height: '100%',
    background: 'linear-gradient(90deg, #667eea, #764ba2)',
    transition: 'width 0.3s ease'
  },
  progressText: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#667eea'
  },
  statusInfo: {
    padding: '15px',
    background: '#f0f9ff',
    borderLeft: '4px solid #667eea',
    borderRadius: '4px',
    fontSize: '14px'
  },
  message: {
    marginTop: '10px',
    fontStyle: 'italic',
    color: '#666'
  },
  chunkVisualization: {
    marginTop: '20px',
    paddingTop: '20px',
    borderTop: '1px solid #e5e7eb'
  },
  chunkLabel: {
    fontSize: '14px',
    fontWeight: '600',
    marginBottom: '10px'
  },
  chunkGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(12px, 1fr))',
    gap: '4px',
    marginBottom: '10px'
  },
  chunk: {
    width: '100%',
    aspectRatio: '1',
    borderRadius: '2px',
    transition: 'background-color 0.2s'
  },
  chunkLegend: {
    fontSize: '12px',
    color: '#666',
    display: 'flex',
    gap: '15px'
  },
  legend: {
    marginRight: '5px',
    fontWeight: 'bold'
  },
  errorBox: {
    padding: '15px',
    background: '#fee2e2',
    border: '1px solid #fecaca',
    borderRadius: '8px',
    marginBottom: '20px'
  },
  errorTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#991b1b',
    margin: '0 0 8px 0'
  },
  errorMessage: {
    fontSize: '14px',
    color: '#7f1d1d',
    margin: '0'
  },
  successBox: {
    padding: '15px',
    background: '#dcfce7',
    border: '1px solid #bbf7d0',
    borderRadius: '8px',
    marginBottom: '20px'
  },
  successTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#166534',
    margin: '0 0 8px 0'
  },
  buttonGroup: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap'
  },
  primaryButton: {
    padding: '12px 24px',
    background: 'linear-gradient(135deg, #667eea, #764ba2)',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'transform 0.2s, opacity 0.2s'
  },
  secondaryButton: {
    padding: '12px 24px',
    background: '#f3f4f6',
    color: '#1f2937',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background 0.2s'
  },
  dangerButton: {
    padding: '12px 24px',
    background: '#fee2e2',
    color: '#991b1b',
    border: '1px solid #fecaca',
    borderRadius: '6px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background 0.2s'
  },
  downloadButton: {
    marginTop: '10px',
    padding: '12px 24px',
    background: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background 0.2s'
  },
  infoBox: {
    padding: '20px',
    background: '#fffbeb',
    border: '1px solid #fde68a',
    borderRadius: '8px',
    marginTop: '20px'
  },
  footer: {
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: '40px',
    fontSize: '14px'
  }
};

export default App;

