const express = require('express');
module.exports = () => {
  const r = express.Router();
  r.post('/signal', (req,res) => {
    res.json({ ok: true });
  });
  return r;
};