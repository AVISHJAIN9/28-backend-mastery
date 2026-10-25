const { v4: uuidv4 } = require('uuid');

const buckets = new Map();
const files = new Map();

exports.createBucket = (req, res) => {
  const { bucketName } = req.validatedBody;
  
  if (buckets.has(bucketName)) {
    return res.status(409).json({ error: 'Bucket already exists' });
  }
  
  buckets.set(bucketName, {
    name: bucketName,
    createdAt: new Date(),
    files: [],
  });
  
  res.json({
    success: true,
    bucket: bucketName,
    message: 'Bucket created',
  });
};

exports.getPresignedUploadUrl = (req, res) => {
  const { bucketName, fileName, contentType, expiresIn } = req.validatedBody;
  
  if (!buckets.has(bucketName)) {
    return res.status(404).json({ error: 'Bucket not found' });
  }
  
  const presignedUrl = `https://s3.amazonaws.com/${bucketName}/${fileName}?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Expires=${expiresIn}`;
  
  res.json({
    success: true,
    bucketName,
    fileName,
    presignedUrl,
    expiresIn,
    method: 'PUT',
  });
};

exports.getPresignedDownloadUrl = (req, res) => {
  const { bucketName, fileName, expiresIn } = req.validatedBody;
  
  if (!buckets.has(bucketName)) {
    return res.status(404).json({ error: 'Bucket not found' });
  }
  
  const presignedUrl = `https://s3.amazonaws.com/${bucketName}/${fileName}?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Expires=${expiresIn}`;
  
  res.json({
    success: true,
    bucketName,
    fileName,
    presignedUrl,
    expiresIn,
    method: 'GET',
  });
};

exports.listObjects = (req, res) => {
  const { bucketName } = req.validatedBody;
  
  if (!buckets.has(bucketName)) {
    return res.status(404).json({ error: 'Bucket not found' });
  }
  
  const bucket = buckets.get(bucketName);
  const objectList = Array.from(files.values()).filter(f => f.bucket === bucketName);
  
  res.json({
    success: true,
    bucketName,
    total: objectList.length,
    objects: objectList,
  });
};

exports.deleteObject = (req, res) => {
  const { bucketName, fileName } = req.validatedBody;
  
  const fileKey = `${bucketName}/${fileName}`;
  files.delete(fileKey);
  
  res.json({
    success: true,
    bucketName,
    fileName,
    message: 'Object deleted',
  });
};

exports.simulateUpload = (req, res) => {
  const { bucketName, fileName } = req.validatedBody;
  
  const fileId = uuidv4();
  const fileKey = `${bucketName}/${fileName}`;
  
  files.set(fileKey, {
    id: fileId,
    bucket: bucketName,
    key: fileName,
    size: Math.random() * 10000000,
    uploadedAt: new Date(),
  });
  
  res.json({
    success: true,
    bucketName,
    fileName,
    etag: uuidv4(),
    message: 'Upload successful',
  });
};

module.exports = {
  createBucket,
  getPresignedUploadUrl,
  getPresignedDownloadUrl,
  listObjects,
  deleteObject,
  simulateUpload,
};
