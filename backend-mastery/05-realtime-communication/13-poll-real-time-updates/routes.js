const express = require('express');
const PollController = require('./controller');
module.exports = (app, io) => {
  const pc = new PollController(io);
  const r = express.Router();
  r.post('/', (req,res) => { const poll = pc.createPoll(req.body); res.json(poll); });
  r.post('/:pollId/vote', (req,res) => {
    const ok = pc.vote(req.params.pollId, req.body.option, req.user.id);
    res.json({ voted: ok });
  });
  r.get('/:pollId/results', (req,res) => res.json(pc.getResults(req.params.pollId)));
  return r;
};