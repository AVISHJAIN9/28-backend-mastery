/**
 * RoomsController - Manages live streaming rooms and viewers
 * Handles room lifecycle, viewer tracking, and room queries
 */

class RoomsController {
  constructor(io) {
    this.io = io;
    this.rooms = new Map();
    this.roomViewers = new Map(); // roomId -> Set of viewer data
    this.userSocketMap = new Map(); // userId -> socketId
  }

  // ==================== Room Management ====================

  /**
   * Create a new room
   * @param {string} roomId - Unique room identifier
   * @param {object} data - Room configuration
   * @returns {object} Created room object
   */
  createRoom(roomId, data) {
    if (this.rooms.has(roomId)) {
      throw new Error(`Room ${roomId} already exists`);
    }

    const room = {
      id: roomId,
      name: data.name || `Room ${roomId}`,
      description: data.description || '',
      isPrivate: data.isPrivate || false,
      isLive: data.isLive !== undefined ? data.isLive : false,
      streamerId: data.streamerId || null,
      maxViewers: data.maxViewers || 1000,
      createdAt: new Date(),
      updatedAt: new Date(),
      messageCount: 0,
      totalViewers: 0 // Lifetime total
    };

    this.rooms.set(roomId, room);
    this.roomViewers.set(roomId, new Map()); // Store viewer data by socketId

    console.log(`✓ Room created: ${roomId}`);
    return room;
  }

  /**
   * Get room by ID
   * @param {string} roomId - Room ID
   * @returns {object|null} Room object or null
   */
  getRoom(roomId) {
    return this.rooms.get(roomId) || null;
  }

  /**
   * List all rooms
   * @returns {array} Array of room objects with current viewer count
   */
  listRooms() {
    const roomList = [];
    
    for (const [roomId, room] of this.rooms) {
      const viewers = this.roomViewers.get(roomId) || new Map();
      roomList.push({
        ...room,
        currentViewers: viewers.size,
        viewerList: Array.from(viewers.values())
      });
    }

    return roomList;
  }

  /**
   * Update room settings
   * @param {string} roomId - Room ID
   * @param {object} updates - Fields to update
   * @returns {object} Updated room object
   */
  updateRoom(roomId, updates) {
    const room = this.rooms.get(roomId);
    
    if (!room) {
      throw new Error(`Room ${roomId} not found`);
    }

    const allowedFields = ['name', 'description', 'isLive', 'maxViewers'];
    
    for (const field of allowedFields) {
      if (field in updates) {
        room[field] = updates[field];
      }
    }

    room.updatedAt = new Date();
    this.rooms.set(roomId, room);

    console.log(`✓ Room updated: ${roomId}`);
    return room;
  }

  /**
   * Delete a room
   * @param {string} roomId - Room ID
   * @returns {boolean} Success status
   */
  deleteRoom(roomId) {
    if (!this.rooms.has(roomId)) {
      throw new Error(`Room ${roomId} not found`);
    }

    // Disconnect all viewers in room
    if (this.io) {
      this.io.to(roomId).emit('room:closed', {
        message: 'Room has been closed',
        timestamp: new Date().toISOString()
      });
    }

    this.rooms.delete(roomId);
    this.roomViewers.delete(roomId);

    console.log(`✓ Room deleted: ${roomId}`);
    return true;
  }

  // ==================== Viewer Management ====================

  /**
   * Add viewer to room
   * @param {string} roomId - Room ID
   * @param {string} socketId - Socket ID
   * @param {object} viewerData - Viewer information
   * @returns {boolean} Success status
   */
  addViewer(roomId, socketId, viewerData) {
    if (!this.roomViewers.has(roomId)) {
      this.roomViewers.set(roomId, new Map());
    }

    const viewers = this.roomViewers.get(roomId);
    const viewer = {
      socketId,
      userId: viewerData.userId,
      username: viewerData.username,
      joinedAt: new Date(),
      isActive: true
    };

    viewers.set(socketId, viewer);

    // Track user-socket mapping
    if (viewerData.userId) {
      this.userSocketMap.set(viewerData.userId, socketId);
    }

    // Update room stats
    const room = this.rooms.get(roomId);
    if (room) {
      room.totalViewers++;
      room.updatedAt = new Date();
    }

    console.log(`✓ Viewer added to room ${roomId}: ${viewerData.username}`);
    return true;
  }

  /**
   * Remove viewer from room
   * @param {string} roomId - Room ID
   * @param {string} socketId - Socket ID
   * @returns {boolean} Success status
   */
  removeViewer(roomId, socketId) {
    const viewers = this.roomViewers.get(roomId);
    
    if (!viewers) {
      return false;
    }

    const viewer = viewers.get(socketId);
    
    if (viewer && viewer.userId) {
      this.userSocketMap.delete(viewer.userId);
    }

    viewers.delete(socketId);

    const room = this.rooms.get(roomId);
    if (room) {
      room.updatedAt = new Date();
    }

    console.log(`✓ Viewer removed from room ${roomId}`);
    return true;
  }

  /**
   * Get all viewers in room
   * @param {string} roomId - Room ID
   * @returns {array} Array of viewer objects
   */
  getViewers(roomId) {
    const viewers = this.roomViewers.get(roomId);
    return viewers ? Array.from(viewers.values()) : [];
  }

  /**
   * Get viewer count in room
   * @param {string} roomId - Room ID
   * @returns {number} Number of active viewers
   */
  getViewerCount(roomId) {
    const viewers = this.roomViewers.get(roomId);
    return viewers ? viewers.size : 0;
  }

  /**
   * Check if room has reached max viewers
   * @param {string} roomId - Room ID
   * @returns {boolean} True if at capacity
   */
  isRoomFull(roomId) {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    const currentViewers = this.getViewerCount(roomId);
    return currentViewers >= room.maxViewers;
  }

  // ==================== Message Tracking ====================

  /**
   * Increment message count for room
   * @param {string} roomId - Room ID
   */
  recordMessage(roomId) {
    const room = this.rooms.get(roomId);
    if (room) {
      room.messageCount++;
      room.updatedAt = new Date();
    }
  }

  /**
   * Get room statistics
   * @param {string} roomId - Room ID
   * @returns {object} Room stats
   */
  getRoomStats(roomId) {
    const room = this.rooms.get(roomId);
    
    if (!room) {
      throw new Error(`Room ${roomId} not found`);
    }

    const currentViewers = this.getViewerCount(roomId);

    return {
      roomId,
      name: room.name,
      isLive: room.isLive,
      currentViewers,
      totalViewers: room.totalViewers,
      messageCount: room.messageCount,
      maxViewers: room.maxViewers,
      isFull: currentViewers >= room.maxViewers,
      createdAt: room.createdAt,
      updatedAt: room.updatedAt,
      uptime: new Date() - room.createdAt
    };
  }

  // ==================== Queries for API ====================

  /**
   * Get live rooms only
   * @returns {array} Array of live room objects
   */
  getLiveRooms() {
    return this.listRooms().filter(room => room.isLive);
  }

  /**
   * Get public rooms only
   * @returns {array} Array of public room objects
   */
  getPublicRooms() {
    return this.listRooms().filter(room => !room.isPrivate);
  }

  /**
   * Search rooms by name
   * @param {string} query - Search query
   * @returns {array} Matching rooms
   */
  searchRooms(query) {
    const lowerQuery = query.toLowerCase();
    return this.listRooms().filter(room => 
      room.name.toLowerCase().includes(lowerQuery) ||
      room.description.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Get all room statistics
   * @returns {object} Global statistics
   */
  getglobalStats() {
    const rooms = this.listRooms();
    const totalRooms = rooms.length;
    const liveRooms = rooms.filter(r => r.isLive).length;
    const totalViewers = rooms.reduce((sum, r) => sum + r.currentViewers, 0);
    const totalMessages = rooms.reduce((sum, r) => sum + r.messageCount, 0);

    return {
      totalRooms,
      liveRooms,
      totalViewers,
      totalMessages,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = RoomsController;