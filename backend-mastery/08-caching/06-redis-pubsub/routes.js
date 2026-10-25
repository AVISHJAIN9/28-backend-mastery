import express from 'express';

const createRoutes = (app, io, redisPublisher, PubSubController) => {
  const router = express.Router();
  const pubsubController = new PubSubController(io, redisPublisher);

  router.post('/publish', async (req, res) => {
    try {
      const { channel, message } = req.body;
      if (!channel || !message) {
        return res.status(400).json({ error: 'channel and message required' });
      }
      const result = await pubsubController.publishMessage(channel, message);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/broadcast-room', async (req, res) => {
    try {
      const { roomId, messageType, data } = req.body;
      if (!roomId || !messageType) {
        return res.status(400).json({ error: 'roomId and messageType required' });
      }
      const result = await pubsubController.broadcastToRoom(roomId, messageType, data);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/notify-user', async (req, res) => {
    try {
      const { userId, title, message } = req.body;
      if (!userId || !title) {
        return res.status(400).json({ error: 'userId and title required' });
      }
      const result = await pubsubController.notifyUser(userId, { title, message });
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get('/rooms', (req, res) => {
    try {
      const rooms = pubsubController.getActiveRooms();
      res.json({ rooms, total: rooms.length });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get('/rooms/:roomId/members', (req, res) => {
    try {
      const { roomId } = req.params;
      const members = pubsubController.getRoomMembers(roomId);
      res.json({ roomId, members, count: members.length });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get('/metrics', (req, res) => {
    try {
      const metrics = pubsubController.getMetrics();
      res.json(metrics);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.locals.pubsubController = pubsubController;
  return router;
};

export default createRoutes;

