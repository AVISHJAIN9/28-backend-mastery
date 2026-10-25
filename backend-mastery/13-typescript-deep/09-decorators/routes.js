import express from 'express';
import UserController from './controller.js';

const router = express.Router();

router.get('/users/:id', UserController.getUser);
router.post('/users', UserController.createUser);

export default router;
