const express = require('express');
const WhiteboardController = require('./controller');
module.exports = (app, io) => {
  const wc = new WhiteboardController(io);
  const r = express.Router();
  r.post('/', (req,res) => { wc.createBoard(req.body.id); res.json({ ok: true }); });
  r.get('/:boardId', (req,res) => res.json(wc.getBoard(req.params.boardId)));
  return r;
};