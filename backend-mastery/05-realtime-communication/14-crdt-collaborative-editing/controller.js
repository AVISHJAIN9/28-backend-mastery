class CRDTController {
  constructor(io) { this.io = io; this.docs = new Map(); }
  createDocument(docId, initialContent = '') {
    this.docs.set(docId, { content: initialContent, operations: [], cursors: new Map() });
  }
  applyOperation(docId, op) {
    const doc = this.docs.get(docId);
    if (!doc) return;
    if(op.type === 'insert') {
      doc.content = doc.content.slice(0, op.position) + op.content + doc.content.slice(op.position);
    } else if(op.type === 'delete') {
      doc.content = doc.content.slice(0, op.position) + doc.content.slice(op.position + 1);
    }
    doc.operations.push(op);
    this.io.emit('doc:changed', { docId, op, content: doc.content });
  }
  getDocument(docId) { return this.docs.get(docId); }
}
module.exports = CRDTController;