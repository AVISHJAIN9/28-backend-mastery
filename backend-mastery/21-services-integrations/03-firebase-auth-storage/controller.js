const { v4: uuidv4 } = require('uuid');

// ==================== State (In-memory Database) ====================
const users = new Map();
const documents = new Map();
const files = new Map();

// ==================== Authentication ====================

exports.register = async (req, res) => {
  const { email, password, displayName } = req.validatedBody;

  try {
    // Check if user exists
    if (Array.from(users.values()).find(u => u.email === email)) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const uid = uuidv4();
    const user = {
      uid,
      email,
      password, // Note: Store hashed in production
      displayName,
      createdAt: new Date(),
      photoURL: null,
    };

    users.set(uid, user);

    res.json({
      success: true,
      uid,
      email,
      displayName,
      message: 'User registered successfully',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.validatedBody;

  try {
    const user = Array.from(users.values()).find(u => u.email === email);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.password !== password) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    // In production, create JWT token
    const token = 'token_' + user.uid + '_' + Date.now();

    res.json({
      success: true,
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      token,
      expiresIn: 3600,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.logout = (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
};

// ==================== Profile Management ====================

exports.getProfile = (req, res) => {
  const user = users.get(req.uid);
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({
    success: true,
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    createdAt: user.createdAt,
  });
};

exports.updateProfile = (req, res) => {
  const user = users.get(req.uid);
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const { displayName, photoURL, phoneNumber } = req.validatedBody;
  
  if (displayName) user.displayName = displayName;
  if (photoURL) user.photoURL = photoURL;
  if (phoneNumber) user.phoneNumber = phoneNumber;
  user.updatedAt = new Date();

  res.json({
    success: true,
    message: 'Profile updated',
    user: {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
    },
  });
};

// ==================== Document Management ====================

exports.createDocument = (req, res) => {
  const { title, content, docType, tags, public: isPublic } = req.validatedBody;
  
  const docId = uuidv4();
  const doc = {
    id: docId,
    uid: req.uid,
    title,
    content,
    docType: docType || 'document',
    tags: tags || [],
    public: isPublic || false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  documents.set(docId, doc);

  res.json({
    success: true,
    id: docId,
    message: 'Document created',
  });
};

exports.getDocument = (req, res) => {
  const { docId } = req.params;
  const doc = documents.get(docId);

  if (!doc) {
    return res.status(404).json({ error: 'Document not found' });
  }

  // Check permissions
  if (doc.uid !== req.uid && !doc.public) {
    return res.status(403).json({ error: 'Access denied' });
  }

  res.json({ success: true, document: doc });
};

exports.listDocuments = (req, res) => {
  const userDocs = Array.from(documents.values()).filter(d => d.uid === req.uid);
  
  res.json({
    success: true,
    total: userDocs.length,
    documents: userDocs,
  });
};

exports.updateDocument = (req, res) => {
  const { docId } = req.params;
  const doc = documents.get(docId);

  if (!doc) {
    return res.status(404).json({ error: 'Document not found' });
  }

  if (doc.uid !== req.uid) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const { title, content, tags } = req.validatedBody;
  if (title) doc.title = title;
  if (content) doc.content = content;
  if (tags) doc.tags = tags;
  doc.updatedAt = new Date();

  res.json({ success: true, message: 'Document updated' });
};

exports.deleteDocument = (req, res) => {
  const { docId } = req.params;
  const doc = documents.get(docId);

  if (!doc) {
    return res.status(404).json({ error: 'Document not found' });
  }

  if (doc.uid !== req.uid) {
    return res.status(403).json({ error: 'Access denied' });
  }

  documents.delete(docId);
  res.json({ success: true, message: 'Document deleted' });
};

// ==================== File Storage ====================

exports.uploadFile = (req, res) => {
  const { fileName, contentType } = req.validatedBody;
  
  const fileId = uuidv4();
  const file = {
    id: fileId,
    uid: req.uid,
    fileName,
    contentType: contentType || 'application/octet-stream',
    createdAt: new Date(),
    downloadURL: `https://storage.example.com/${fileId}`,
  };

  files.set(fileId, file);

  res.json({
    success: true,
    id: fileId,
    fileName,
    downloadURL: file.downloadURL,
    message: 'File uploaded',
  });
};

exports.listFiles = (req, res) => {
  const userFiles = Array.from(files.values()).filter(f => f.uid === req.uid);
  
  res.json({
    success: true,
    total: userFiles.length,
    files: userFiles,
  });
};

exports.deleteFile = (req, res) => {
  const { fileId } = req.params;
  const file = files.get(fileId);

  if (!file) {
    return res.status(404).json({ error: 'File not found' });
  }

  if (file.uid !== req.uid) {
    return res.status(403).json({ error: 'Access denied' });
  }

  files.delete(fileId);
  res.json({ success: true, message: 'File deleted' });
};

module.exports = {
  register,
  login,
  logout,
  getProfile,
  updateProfile,
  createDocument,
  getDocument,
  listDocuments,
  updateDocument,
  deleteDocument,
  uploadFile,
  listFiles,
  deleteFile,
};
