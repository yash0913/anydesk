/**
 * DEBUG ENDPOINT: Socket State Visibility
 * GET /debug/socket-state
 * Returns current socket connections, device registry, and active meetings
 */

const express = require('express');
const router = express.Router();

function getSocketState() {
  const ioInstance = require('./socketManager').getIoInstance();
  if (!ioInstance) {
    return { error: 'Socket.IO not initialized' };
  }

  // Get all connected sockets
  const sockets = [];
  ioInstance.sockets.sockets.forEach((socket, id) => {
    sockets.push({
      id,
      userId: socket.userId,
      userPhone: socket.userPhone,
      connected: socket.connected,
      rooms: Array.from(socket.rooms || []),
    });
  });

  // Get device registry
  const deviceRegistry = [];
  const deviceRegistryById = require('./socketManager').getDeviceRegistry();
  if (deviceRegistryById) {
    for (const [deviceId, meta] of deviceRegistryById.entries()) {
      deviceRegistry.push({
        deviceId,
        userId: meta.userId,
        deviceType: meta.deviceType,
        isOnline: meta.isOnline,
        lastSeen: meta.lastSeen,
      });
    }
  }

  // Get active meetings
  const activeMeetings = [];
  const roomsMap = require('./socketManager').getRoomsMap();
  if (roomsMap) {
    for (const [roomId, roomUsers] of roomsMap.entries()) {
      const participants = [];
      for (const [userId, data] of roomUsers.entries()) {
        participants.push({
          userId,
          userName: data.userName,
          isHost: data.isHost,
          authUserId: data.authUserId,
        });
      }
      
      activeMeetings.push({
        roomId,
        participants,
      });
    }
  }

  return {
    timestamp: new Date().toISOString(),
    sockets,
    deviceRegistry,
    activeMeetings,
    totalConnections: sockets.length,
  };
}

router.get('/', (req, res) => {
  try {
    const state = getSocketState();
    res.json(state);
  } catch (err) {
    console.error('[DEBUG] Error generating socket state:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = { router, getSocketState };
