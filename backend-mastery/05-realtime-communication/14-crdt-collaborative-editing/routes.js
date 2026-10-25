const express = require('express');
const CRDTController = require('./controller');
module.exports = (app, io) => {
  const cc = new CRDTController(io);
  const r = express.Router();
  r.post('/', (req,res) => { cc.createDocument(req.body.id, req.body.content || ''); res.json({ ok: true }); });
  return r;
};