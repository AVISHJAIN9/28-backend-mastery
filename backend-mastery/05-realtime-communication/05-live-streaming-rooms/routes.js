const express = require('express');
const { roomAuth } = require('./middleware');
const { roomSchema } = require('./schema');

/**
 * Room Routes - REST API for room management
 */
module.exports = (io, roomsController) => {
  const router = express.Router();

  // ==================== Room Creation & Management ====================

  /**
   * POST /api/rooms - Create a new room
   */
  router.post('/rooms', (req, res) => {
    try {
      const { roomId, name, description, isPrivate, isLive, maxViewers } = req.body;

      // Validate input
      if (!roomId) {
        return res.status(400).json({ error: 'Room ID is required' });
      }

      // Check if room already exists
      if (roomsController.getRoom(roomId)) {
        return res.status(409).json({ error: `Room ${roomId} already exists` });
      }

      // Create room
      const room = roomsController.createRoom(roomId, {
        name,
        description,
        isPrivate,
        isLive,
        maxViewers
      });

      res.status(201).json({
        success: true,
        message: `Room ${roomId} created`,
        room
      });
    } catch (error) {
      console.error('Error creating room:', error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * GET /api/rooms - List all rooms
   */
  router.get('/rooms', (req, res) => {
    try {
      const { filter, search } = req.query;

      let rooms = roomsController.listRooms();

      // Apply filters
      if (filter === 'live') {
        rooms = rooms.filter(r => r.isLive);
      } else if (filter === 'public') {
        rooms = rooms.filter(r => !r.isPrivate);
      }

      // Apply search
      if (search) {
        rooms = roomsController.searchRooms(search);
      }

      res.json({
        success: true,
        count: rooms.length,
        rooms
      });
    } catch (error) {
      console.error('Error listing rooms:', error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * GET /api/rooms/:roomId - Get specific room details
   */
  router.get('/rooms/:roomId', roomAuth, (req, res) => {
    try {
      const { roomId } = req.params;
      const room = roomsController.getRoom(roomId);

      if (!room) {
        return res.status(404).json({ error: `Room ${roomId} not found` });
      }

      const viewers = roomsController.getViewers(roomId);
      const stats = roomsController.getRoomStats(roomId);

      res.json({
        success: true,
        room: {
          ...room,
          currentViewers: viewers.length,
          viewers
        },
        stats
      });
    } catch (error) {
      console.error('Error getting room:', error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * PUT /api/rooms/:roomId - Update room settings
   */
  router.put('/rooms/:roomId', roomAuth, (req, res) => {
    try {
      const { roomId } = req.params;
      const updates = req.body;

      // Check if room exists
      if (!roomsController.getRoom(roomId)) {
        return res.status(404).json({ error: `Room ${roomId} not found` });
      }

      // Update room
      const updatedRoom = roomsController.updateRoom(roomId, updates);

      res.json({
        success: true,
        message: `Room ${roomId} updated`,
        room: updatedRoom
      });
    } catch (error) {
      console.error('Error updating room:', error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * DELETE /api/rooms/:roomId - Delete a room
   */
  router.delete('/rooms/:roomId', roomAuth, (req, res) => {
    try {
      const { roomId } = req.params;

      // Check if room exists
      if (!roomsController.getRoom(roomId)) {
        return res.status(404).json({ error: `Room ${roomId} not found` });
      }

      // Delete room
      roomsController.deleteRoom(roomId);

      res.json({
        success: true,
        message: `Room ${roomId} deleted`
      });
    } catch (error) {
      console.error('Error deleting room:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // ==================== Viewer Management ====================

  /**
   * GET /api/rooms/:roomId/viewers - Get room viewers
   */
  router.get('/rooms/:roomId/viewers', roomAuth, (req, res) => {
    try {
      const { roomId } = req.params;

      if (!roomsController.getRoom(roomId)) {
        return res.status(404).json({ error: `Room ${roomId} not found` });
      }

      const viewers = roomsController.getViewers(roomId);
      const count = roomsController.getViewerCount(roomId);

      res.json({
        success: true,
        roomId,
        viewerCount: count,
        viewers
      });
    } catch (error) {
      console.error('Error getting viewers:', error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * GET /api/rooms/:roomId/capacity - Check room capacity
   */
  router.get('/rooms/:roomId/capacity', roomAuth, (req, res) => {
    try {
      const { roomId } = req.params;

      if (!roomsController.getRoom(roomId)) {
        return res.status(404).json({ error: `Room ${roomId} not found` });
      }

      const room = roomsController.getRoom(roomId);
      const currentViewers = roomsController.getViewerCount(roomId);
      const isFull = roomsController.isRoomFull(roomId);

      res.json({
        success: true,
        roomId,
        maxViewers: room.maxViewers,
        currentViewers,
        availableSlots: room.maxViewers - currentViewers,
        isFull
      });
    } catch (error) {
      console.error('Error checking capacity:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // ==================== Statistics ====================

  /**
   * GET /api/stats - Get global statistics
   */
  router.get('/stats/global', (req, res) => {
    try {
      const stats = roomsController.getglobalStats();
      res.json({
        success: true,
        stats
      });
    } catch (error) {
      console.error('Error getting stats:', error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * GET /api/rooms/:roomId/stats - Get room statistics
   */
  router.get('/rooms/:roomId/stats', roomAuth, (req, res) => {
    try {
      const { roomId } = req.params;

      if (!roomsController.getRoom(roomId)) {
        return res.status(404).json({ error: `Room ${roomId} not found` });
      }

      const stats = roomsController.getRoomStats(roomId);

      res.json({
        success: true,
        stats
      });
    } catch (error) {
      console.error('Error getting room stats:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // ==================== Search & Filter ====================

  /**
   * GET /api/rooms/search/live - Get live rooms
   */
  router.get('/search/live', (req, res) => {
    try {
      const liveRooms = roomsController.getLiveRooms();
      res.json({
        success: true,
        count: liveRooms.length,
        rooms: liveRooms
      });
    } catch (error) {
      console.error('Error getting live rooms:', error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * GET /api/rooms/search/public - Get public rooms
   */
  router.get('/search/public', (req, res) => {
    try {
      const publicRooms = roomsController.getPublicRooms();
      res.json({
        success: true,
        count: publicRooms.length,
        rooms: publicRooms
      });
    } catch (error) {
      console.error('Error getting public rooms:', error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * GET /api/rooms/search?q=query - Search rooms
   */
  router.get('/search', (req, res) => {
    try {
      const { q } = req.query;

      if (!q) {
        return res.status(400).json({ error: 'Search query required' });
      }

      const results = roomsController.searchRooms(q);
      res.json({
        success: true,
        query: q,
        count: results.length,
        rooms: results
      });
    } catch (error) {
      console.error('Error searching rooms:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // ==================== Health Check ====================

  /**
   * GET /api/health - Health check endpoint
   */
  router.get('/health', (req, res) => {
    const stats = roomsController.getglobalStats();
    res.json({
      status: 'ok',
      module: '05 Live Streaming Rooms',
      ...stats
    });
  });

  return router;
};