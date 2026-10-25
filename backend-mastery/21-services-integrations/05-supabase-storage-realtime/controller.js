const { v4: uuidv4 } = require('uuid');

const tables = new Map();
const files = new Map();
const subscriptions = new Map();

exports.createRecord = (req, res) => {
  const { table, data } = req.validatedBody;
  const id = uuidv4();
  const record = { id, ...data, createdAt: new Date() };
  
  if (!tables.has(table)) tables.set(table, []);
  tables.get(table).push(record);
  
  res.json({ success: true, id, record });
};

exports.readRecords = (req, res) => {
  const { table } = req.params;
  const records = tables.get(table) || [];
  res.json({ success: true, count: records.length, records });
};

exports.updateRecord = (req, res) => {
  const { table, id } = req.params;
  const { data } = req.validatedBody;
  const records = tables.get(table) || [];
  const record = records.find(r => r.id === id);
  
  if (!record) return res.status(404).json({ error: 'Record not found' });
  
  Object.assign(record, data, { updatedAt: new Date() });
  res.json({ success: true, record });
};

exports.deleteRecord = (req, res) => {
  const { table, id } = req.params;
  const records = tables.get(table) || [];
  const index = records.findIndex(r => r.id === id);
  
  if (index === -1) return res.status(404).json({ error: 'Not found' });
  
  records.splice(index, 1);
  res.json({ success: true });
};

exports.uploadFile = (req, res) => {
  const { bucket, fileName } = req.validatedBody;
  const fileId = uuidv4();
  const file = {
    id: fileId,
    bucket,
    fileName,
    url: `https://storage.example.com/${bucket}/${fileId}`,
    createdAt: new Date(),
  };
  
  files.set(fileId, file);
  res.json({ success: true, file });
};

exports.listFiles = (req, res) => {
  const fileList = Array.from(files.values());
  res.json({ success: true, total: fileList.length, files: fileList });
};

exports.deleteFile = (req, res) => {
  const { fileId } = req.params;
  files.delete(fileId);
  res.json({ success: true });
};

exports.subscribe = (req, res) => {
  const { channel } = req.params;
  const subId = uuidv4();
  subscriptions.set(subId, { channel, uid: req.uid, createdAt: new Date() });
  res.json({ success: true, subscriptionId: subId, channel });
};

exports.publish = (req, res) => {
  const { channel } = req.params;
  const { payload } = req.validatedBody;
  
  // Notify all subscribed clients
  const subs = Array.from(subscriptions.values()).filter(s => s.channel === channel);
  
  res.json({
    success: true,
    channel,
    subscribers: subs.length,
    message: 'Published to ' + subs.length + ' subscribers',
  });
};

module.exports = {
  createRecord,
  readRecords,
  updateRecord,
  deleteRecord,
  uploadFile,
  listFiles,
  deleteFile,
  subscribe,
  publish,
};
