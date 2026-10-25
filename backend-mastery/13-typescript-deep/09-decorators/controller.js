import express from 'express';

const userController = {
  getUser: (req, res) => {
    const id = parseInt(req.params.id);
    res.json({ id, name: 'Alice', email: 'alice@test.com' });
  },

  createUser: (req, res) => {
    const { name, email } = req.body;
    res.status(201).json({ id: Math.random(), name, email });
  }
};

export default userController;
