const express = require('express');
const jwt = require('jsonwebtoken');
module.exports = () => {
  const router = express.Router();
  router.post('/login', (req,res) => {
    const token = jwt.sign({userId: req.body.userId}, process.env.JWT_SECRET, {expiresIn: '24h'});
    res.json({token});
  });
  return router;
};