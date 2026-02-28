/**
 * Socket.IO Server
 * - WebRTC signaling for Meet
 * - Realtime private messaging for ChatSpace
 * - Remote Desktop Signaling (Added)
 */

const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const Message = require('./models/Message');
const RemoteSession = require('./models/RemoteSession');
const Device = require('./models/Device');
const MeetingControlSession = require('./models/MeetingControlSession');
const { verifySessionToken, createSessionToken } = require('./utils/sessionToken');

let ioInstance = null;
let roomsMap = null; // Map<roomId, Map<userId, {socketId, userName, isHost, authUserId}>>
const onlineUsersByPhone = new Map(); // Map<phoneString, Set<socketId>>
const onlineUsersById = new Map(); // Map<userId, Set<socketId>>
const onlineDevicesById = new Map(); // Map<deviceId, Set<socketId>>
const deviceRegistryById = new Map(); // Map<deviceId, { userId, deviceType, socketId, lastSeen, isOnline }>
const pendingSignalsByDevice = new Map(); // Map<deviceId, Array<{event,payload}>>
const metrics = { activeSessions: 0, offersRelayed: 0, iceFailures: 0, datachannelMsgs: 0 };

/**
 * Check if a user (by authUserId) is currently in a meeting room.
 * Used by REST API for Option A authorization.
 */
function isUserInMeeting(roomId, authUserId) {
  if (!roomsMap || !roomId || !authUserId) return false;
  const roomUsers = roomsMap.get(String(roomId));
  if (!roomUsers) return false;
  for (const [, data] of roomUsers.entries()) {
    if (data && String(data.authUserId) === String(authUserId)) {
      return true;
    }
  }
  return false;
}

function trackUserSocket(map, key, socketId) {
  if (!key) return;
  if (!map.has(key)) {
    map.set(key, new Set());
  }
  map.get(key).add(socketId);
}

function untrackUserSocket(map, key, socketId) {
  if (!key || !map.has(key)) return;
  const set = map.get(key);
  set.delete(socketId);
  if (set.size === 0) {
    map.delete(key);
  }
}

function emitToUser(userId, event, payload) {
  if (!ioInstance || !userId) return;
  const sockets = onlineUsersById.get(String(userId));
  if (!sockets) return;
  sockets.forEach((socketId) => {
    const target = ioInstance.sockets.sockets.get(socketId);
    if (target) {
      target.emit(event, payload);
    }
  });
}

function getDeviceRegistrySnapshotForUser(userId) {
  const out = [];
  for (const [deviceId, meta] of deviceRegistryById.entries()) {
    if (meta && String(meta.userId) === String(userId)) {
      out.push({ deviceId, ...meta });
    }
  }
  out.sort((a, b) => (b.lastSeen || 0) - (a.lastSeen || 0));
  return out;
}

function emitToDevice(deviceId, event, payload) {
  if (!ioInstance || !deviceId) return;
  const devId = String(deviceId);
  const meta = deviceRegistryById.get(devId);
  const isNativeOnline = !!meta && meta.isOnline === true && meta.deviceType === 'native-agent';
  if (!isNativeOnline) {
    console.warn(`[ROUTING] Cannot emit ${event} to ${devId} - native device not online/registered`);
    const hostUserId = payload && (payload.hostUserId || payload.toUserId || payload.ownerUserId || payload.userId);
    if (hostUserId) {
      console.warn('[ROUTING] Full registry snapshot for hostUserId:', hostUserId, getDeviceRegistrySnapshotForUser(hostUserId));
    } else {
      console.warn('[ROUTING] Full device registry keys:', Array.from(deviceRegistryById.keys()));
    }
    return;
  }

  console.log(`[ROUTING] Emitting ${event} to ${devId} (native-agent)`);

  const set = onlineDevicesById.get(devId);
  if (!set) {
    console.warn(`[ROUTING] Device ${devId} meta exists but socket set missing`);
    return;
  }
  set.forEach((socketId) => {
    const socket = ioInstance.sockets.sockets.get(socketId);
    if (socket) {
      socket.emit(event, payload);
    }
  });
}

function queueSignal(deviceId, event, payload) {
  if (!pendingSignalsByDevice.has(String(deviceId))) pendingSignalsByDevice.set(String(deviceId), []);
  pendingSignalsByDevice.get(String(deviceId)).push({ event, payload, ts: Date.now() });
}

async function validateSessionAccess(sessionId, userId) {
  if (!sessionId) return null;

  const session = await RemoteSession.findOne({ sessionId });
  if (!session) return null;

  // If a userId is provided, enforce that they are caller or receiver.
  if (userId &&
    String(session.callerUserId) !== String(userId) &&
    String(session.receiverUserId) !== String(userId)) {
    return null;
  }

  return session;
}

function createSocketServer(server, clientOrigin) {
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  ioInstance = io;


  // Store room data for meetings
  const rooms = new Map(); // Map<roomId, Map<userId, {socketId, userName, isHost}>>
  roomsMap = rooms; // expose for REST API authorization
  const roomPermissions = new Map(); // Map<roomId, { micLocked, cameraLocked, chatDisabled }>
  const roomChats = new Map(); // Map<roomId, Array<{ roomId, userId, userName, text, ts }>>

  // =========================================================
  // Meeting Remote Access Control (Option A: per-owner)
  // =========================================================
  // Map<roomId, Map<ownerAuthUserId, { activeController: string|null, pendingRequests: Array<{ userId: string, requestedAt: number }> }>>
  const meetingAccessState = new Map();

  function getAuthUserIdForSocket(sock) {
    const id = sock.userId;
    if (!id || String(id).startsWith('guest-')) return null;
    return String(id);
  }

  function findMeetingUserByAuth(roomId, authUserId) {
    const roomUsers = rooms.get(roomId);
    if (!roomUsers || !authUserId) return null;
    for (const [meetingUserId, data] of roomUsers.entries()) {
      if (data && String(data.authUserId) === String(authUserId)) {
        return { meetingUserId, data };
      }
    }
    return null;
  }

  function isAuthUserInRoom(roomId, authUserId) {
    return !!findMeetingUserByAuth(roomId, authUserId);
  }

  function getDisplayName(roomId, authUserId) {
    const found = findMeetingUserByAuth(roomId, authUserId);
    if (found && found.data && found.data.userName) return String(found.data.userName);
    return String(authUserId || '');
  }

  function getOrInitOwnerState(roomId, ownerId) {
    if (!meetingAccessState.has(roomId)) meetingAccessState.set(roomId, new Map());
    const byOwner = meetingAccessState.get(roomId);
    if (!byOwner.has(String(ownerId))) {
      byOwner.set(String(ownerId), { activeController: null, pendingRequests: [] });
    }
    return byOwner.get(String(ownerId));
  }

  function emitAccessState(roomId, ownerId) {
    const byOwner = meetingAccessState.get(roomId);
    const state = byOwner ? byOwner.get(String(ownerId)) : null;
    io.to(roomId).emit('access-state', {
      meetingId: roomId,
      ownerId: String(ownerId),
      activeController: state ? state.activeController : null,
      pendingRequests: state ? state.pendingRequests : [],
    });
  }

  function cleanupOwnerState(roomId, ownerId, reason) {
    const byOwner = meetingAccessState.get(roomId);
    if (!byOwner) return;
    const state = byOwner.get(String(ownerId));
    if (!state) return;

    const prevController = state.activeController;
    if (prevController) {
      const controllerName = getDisplayName(roomId, prevController);
      console.log(`[Access Revoked] ${controllerName} removed`);
      io.to(roomId).emit('access-revoked', {
        meetingId: roomId,
        ownerId: String(ownerId),
        revokedControllerId: String(prevController),
        reason: reason || 'owner-cleared',
      });
    }

    byOwner.delete(String(ownerId));
    emitAccessState(roomId, ownerId);
    if (byOwner.size === 0) meetingAccessState.delete(roomId);
  }

  // Socket tracking per user
  const userSockets = new Map(); // Map<userId, Set<socketId>>

  function trackUserSocket(socketMap, key, socketId) {
    if (!socketMap.has(key)) {
      socketMap.set(key, new Set());
    }
    socketMap.get(key).add(socketId);
    console.log(`[SOCKET TRACK] Added socket ${socketId} to user ${key}`);
  }

  function removeUserSocket(socketMap, key, socketId) {
    if (socketMap.has(key)) {
      socketMap.get(key).delete(socketId);
      console.log(`[SOCKET TRACK] Removed socket ${socketId} from user ${key}`);
      if (socketMap.get(key).size === 0) {
        socketMap.delete(key);
        console.log(`[SOCKET TRACK] User ${key} has no more sockets, removed entry`);
      }
    }
  }

  function getUserSockets(userId) {
    return userSockets.get(String(userId)) || new Set();
  }

  // Authenticate socket connections using JWT (STRICT - No Guests)
  io.use(async (socket, next) => {
    try {
      const auth = socket.handshake.auth || {};
      const token = auth.token;

      if (!token) {
        console.log(`[AUTH] REJECTED: No token provided from socket ${socket.id}`);
        socket.emit('auth-error', { message: 'Authentication required' });
        socket.disconnect(true);
        return;
      }

      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
      } catch (err) {
        console.log(`[AUTH] REJECTED: Invalid JWT from socket ${socket.id}:`, err.message);
        socket.emit('auth-error', { message: 'Invalid token' });
        socket.disconnect(true);
        return;
      }

      const user = await User.findById(decoded.id);
      if (!user) {
        console.log(`[AUTH] REJECTED: User not found for ID ${decoded.id} from socket ${socket.id}`);
        socket.emit('auth-error', { message: 'User not found' });
        socket.disconnect(true);
        return;
      }

      console.log(`[AUTH] SUCCESS: User ${user._id} (${user.countryCode} ${user.phoneNumber}) authenticated from socket ${socket.id}`);

      socket.user = user;
      socket.userPhone = `${user.countryCode} ${user.phoneNumber}`;
      socket.userId = String(user._id);

      // Track this socket
      trackUserSocket(userSockets, socket.userId, socket.id);
      trackUserSocket(onlineUsersByPhone, socket.userPhone, socket.id);
      trackUserSocket(onlineUsersById, socket.userId, socket.id);

      return next();
    } catch (err) {
      console.log(`[AUTH] ERROR: Authentication failed for socket ${socket.id}:`, err.message);
      socket.emit('auth-error', { message: 'Authentication error' });
      socket.disconnect(true);
    }
  });

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id, socket.userPhone);

    trackUserSocket(onlineUsersByPhone, socket.userPhone, socket.id);
    trackUserSocket(onlineUsersById, socket.userId, socket.id);

    // DeskLink registration
    socket.on('register', async ({ deviceId, deviceType, platform, label, osInfo, deviceName }) => {
      try {
        if (!deviceId) return;

        const devId = String(deviceId);
        const effectiveType = String(deviceType || '');

        // ONLY native agents are devices.
        if (effectiveType !== 'native-agent') {
          console.log('[device] ignoring non-native register', {
            deviceId: devId,
            deviceType: effectiveType,
            socketId: socket.id,
          });
          return;
        }

        socket.data.deviceId = devId;

        // Track in-memory mapping for signaling (native-only)
        trackUserSocket(onlineDevicesById, devId, socket.id);

        const userId = socket.userId ? String(socket.userId) : null;
        deviceRegistryById.set(devId, {
          userId: userId || 'unknown',
          deviceType: effectiveType,
          socketId: socket.id,
          lastSeen: Date.now(),
          isOnline: true,
        });

        // Auto-register or update device record in MongoDB
        const now = new Date();

        if (!userId) {
          console.warn('[device] register called without authenticated user for deviceId=', devId);
          return;
        }

        await Device.updateOne(
          { deviceId: devId },
          {
            $setOnInsert: {
              deviceId: devId,
              registeredAt: now,
            },
            $set: {
              userId: userId,
              deviceName: deviceName || label || 'Agent Device',
              osInfo: osInfo || platform || 'Unknown',
              platform: platform || '',
              deviceType: effectiveType,
              deleted: false,
              blocked: false,
              label: label || 'Agent Device',
              lastOnline: now,
            },
          },
          { upsert: true }
        );

        console.log('[device] registered/updated', devId, 'for user', userId || '(none)');

        // flush pending signals to this device if any
        const pending = pendingSignalsByDevice.get(devId);
        if (pending && pending.length > 0) {
          for (const sig of pending) {
            try {
              socket.emit(sig.event, sig.payload);
            } catch (e) {
              // ignore
            }
          }
          pendingSignalsByDevice.delete(devId);
        }
      } catch (err) {
        console.error('[device] register error', err && err.message);
      }
    });

    // Chat Messaging
    socket.on('private-message', async ({ to, text }) => {
      try {
        if (!text || !String(text).trim()) {
          return;
        }

        const senderPhone = socket.userPhone;
        const receiverPhone = String(to || '').trim();

        if (!receiverPhone) {
          return;
        }

        const msgDoc = await Message.create({
          senderPhone,
          receiverPhone,
          text: String(text).trim(),
        });

        const msg = msgDoc.toObject();

        // Send back to sender
        socket.emit('private-message', msg);

        // Deliver to receiver
        const receiverSockets = onlineUsersByPhone.get(receiverPhone);
        if (receiverSockets && receiverSockets.size > 0) {
          for (const socketId of receiverSockets) {
            const target = io.sockets.sockets.get(socketId);
            if (target) {
              target.emit('private-message', msg);
            }
          }
        }
      } catch (err) {
        console.error('[socket] private-message error', err);
      }
    });

    /**
     * =========================================================
     * START: Remote Desktop Logic (WebRTC Signaling)
     * =========================================================
     */

    /**
  * Fixed WebRTC Signaling Section for socketManager.js
  * Replace the existing WebRTC signaling section with this
  */

    // WebRTC Offer
    socket.on('webrtc-offer', async ({ meetingId, sessionId, fromUserId, fromDeviceId, toDeviceId, sdp, token }) => {
      try {
        // Meeting-native flow: agent emits { meetingId, fromDeviceId, sdp }
        if (meetingId && !toDeviceId) {
          const roomId = String(meetingId);

          const hostSession = await MeetingControlSession.findOne({ meetingId: roomId, isActive: true }).sort({ createdAt: -1 });
          if (!hostSession) {
            console.error('[webrtc-offer] meeting flow: host mapping missing', roomId);
            return;
          }

          const payload = {
            meetingId: roomId,
            fromDeviceId,
            sdp,
          };

          console.log('[webrtc-offer] meeting flow: broadcasting offer to meeting', roomId);
          io.to(roomId).emit('webrtc-offer', payload);
          return;
        }

        console.log(`[webrtc-offer] Session: ${sessionId}, From: ${fromDeviceId} → To: ${toDeviceId}, token present: ${!!token}`);
        console.log(`[webrtc-offer] Token value (first 50 chars):`, token ? token.substring(0, 50) : 'null');
        console.log(`[webrtc-offer] Token type:`, typeof token);

        if (!token || token === 'undefined' || token === 'null') {
          console.error('[WebRTC] Missing session token in offer');
          return;
        }

        try {
          const decoded = verifySessionToken(token);
          if (!decoded) {
            console.warn('[webrtc-offer] token validation failed: verify returned null');
            console.warn('[webrtc-offer] Token that failed (first 100 chars):', token.substring(0, 100));
            return;
          }
          if (decoded.sessionId && decoded.sessionId !== sessionId) {
            console.error('[webrtc-offer] session token mismatch');
            return;
          }
        } catch (e) {
          console.warn('[webrtc-offer] token validation failed:', e.message);
          return;
        }

        // Validate session ownership
        const session = await validateSessionAccess(sessionId, fromUserId);
        if (!session) {
          console.error('[webrtc-offer] invalid session or unauthorized', sessionId, fromUserId);
          return;
        }

        if (session.status !== 'accepted' && session.status !== 'in-progress') {
          console.warn('[webrtc-offer] session not in accepted/in-progress state', sessionId, session.status);
        }

        metrics.offersRelayed++;

        // ✅ FIX: Pass ALL fields including toDeviceId and token
        const payload = {
          sessionId,
          fromUserId,
          fromDeviceId,
          toDeviceId,
          sdp,
          token,
        };

        console.log(`[webrtc-offer] Relaying to device ${toDeviceId}:`, payload);

        // Relay to target device
        emitToDevice(toDeviceId, 'webrtc-offer', payload);

        // If target offline, queue for later
        if (!onlineDevicesById.has(String(toDeviceId))) {
          console.warn(`[webrtc-offer] Device ${toDeviceId} offline, queuing signal`);
          queueSignal(toDeviceId, 'webrtc-offer', payload);
        } else {
          console.log(`[webrtc-offer] Device ${toDeviceId} is ONLINE, signal sent immediately`);
        }
      } catch (err) {
        console.error('[webrtc-offer] error:', err && err.message);
      }
    });

    // WebRTC Answer
    socket.on('webrtc-answer', async ({ meetingId, sessionId, fromUserId, fromDeviceId, toDeviceId, sdp, token }) => {
      try {
        // Meeting-native flow: browser answers with { meetingId, sdp }
        if (meetingId && !toDeviceId) {
          const roomId = String(meetingId);
          const hostSession = await MeetingControlSession.findOne({ meetingId: roomId, isActive: true }).sort({ createdAt: -1 });
          if (!hostSession) {
            console.error('[webrtc-answer] meeting flow: host mapping missing', roomId);
            return;
          }

          const hostDeviceId = String(hostSession.hostDeviceId);
          const payload = {
            meetingId: roomId,
            sdp,
          };

          console.log('[webrtc-answer] meeting flow: relaying answer to host device', hostDeviceId);
          emitToDevice(hostDeviceId, 'webrtc-answer', payload);
          return;
        }

        console.log(`[webrtc-answer] Session: ${sessionId}, From: ${fromDeviceId} → To: ${toDeviceId}`);

        if (token) {
          try {
            const decoded = verifySessionToken(token);
            if (decoded.sessionId && decoded.sessionId !== sessionId) {
              console.error('[webrtc-answer] session token mismatch');
              return;
            }
          } catch (e) {
            console.warn('[webrtc-answer] token validation failed:', e.message);
          }
        }

        const session = await validateSessionAccess(sessionId, fromUserId);
        if (!session) {
          console.error('[webrtc-answer] invalid session or unauthorized', sessionId, fromUserId);
          return;
        }

        // ✅ FIX: Pass ALL fields including toDeviceId and token
        const payload = {
          sessionId,
          fromUserId,
          fromDeviceId,
          toDeviceId,
          sdp,
          token,
        };

        console.log(`[webrtc-answer] Relaying to device ${toDeviceId}:`, payload);

        emitToDevice(toDeviceId, 'webrtc-answer', payload);

        if (!onlineDevicesById.has(String(toDeviceId))) {
          console.warn(`[webrtc-answer] Device ${toDeviceId} offline, queuing signal`);
          queueSignal(toDeviceId, 'webrtc-answer', payload);
        } else {
          console.log(`[webrtc-answer] Device ${toDeviceId} is ONLINE, signal sent immediately`);
        }
      } catch (err) {
        console.error('[webrtc-answer] error:', err && err.message);
      }
    });

    // WebRTC ICE Candidate
    socket.on('webrtc-ice', async ({ meetingId, sessionId, fromUserId, fromDeviceId, toDeviceId, candidate, token }) => {
      try {
        // Meeting-native flow: browser sends ICE with { meetingId, candidate }
        if (meetingId && !toDeviceId) {
          const roomId = String(meetingId);
          const hostSession = await MeetingControlSession.findOne({ meetingId: roomId, isActive: true }).sort({ createdAt: -1 });
          if (!hostSession) {
            return;
          }
          const hostDeviceId = String(hostSession.hostDeviceId);
          emitToDevice(hostDeviceId, 'webrtc-ice', { meetingId: roomId, candidate });
          return;
        }

        if (!token) {
          // Skip candidate if token missing
          return;
        }

        try {
          const decoded = verifySessionToken(token);
          if (!decoded) return;
          if (decoded.sessionId && decoded.sessionId !== sessionId) {
            return;
          }
        } catch (e) {
          return;
        }

        const session = await validateSessionAccess(sessionId, fromUserId);
        if (!session) {
          metrics.iceFailures++;
          return;
        }

        // ✅ FIX: Pass ALL fields including toDeviceId and token
        const payload = {
          sessionId,
          fromUserId,
          fromDeviceId,
          toDeviceId,
          candidate,
          token,
        };

        // Relay candidate
        emitToDevice(toDeviceId, 'webrtc-ice', payload);

        if (!onlineDevicesById.has(String(toDeviceId))) {
          queueSignal(toDeviceId, 'webrtc-ice', payload);
        }
      } catch (err) {
        console.error('[webrtc-ice] error:', err && err.message);
        metrics.iceFailures++;
      }
    });

    // WebRTC Cancel
    socket.on('webrtc-cancel', async ({ sessionId, fromUserId }) => {
      try {
        const session = await validateSessionAccess(sessionId, fromUserId);
        if (!session) return;

        console.log(`[webrtc-cancel] ${sessionId} from ${fromUserId}`);

        // ✅ Emit to both caller and receiver users
        emitToUser(session.callerUserId, 'webrtc-cancel', { sessionId });
        emitToUser(session.receiverUserId, 'webrtc-cancel', { sessionId });

        // ✅ Also emit to devices
        if (session.callerDeviceId) {
          emitToDevice(session.callerDeviceId, 'webrtc-cancel', { sessionId });
        }
        if (session.receiverDeviceId) {
          emitToDevice(session.receiverDeviceId, 'webrtc-cancel', { sessionId });
        }

        session.status = 'ended';
        session.endedAt = new Date();
        session.audit.push({ event: 'cancelled', userId: fromUserId, details: {} });
        await session.save();

        if (metrics.activeSessions > 0) metrics.activeSessions--;
      } catch (err) {
        console.error('[webrtc-cancel] error:', err && err.message);
      }
    });

    /**
     * =========================================================
     * END: Remote Desktop Logic
     * =========================================================
     */


    // ======================
    // WebRTC Meet Signaling
    // ======================

    // User joined room
    socket.on('user-joined', ({ roomId, userId, userName, isHost }) => {

      socket.join(roomId);
      socket.data.roomId = roomId;
      socket.data.userId = userId; // meeting-scoped user id (client-generated)
      socket.data.userName = userName;
      socket.data.isHost = isHost;

      // Add to room (store both meeting user id and authenticated backend user id)
      if (!rooms.has(roomId)) {
        rooms.set(roomId, new Map());
      }
      rooms.get(roomId).set(userId, {
        socketId: socket.id,
        userName,
        isHost,
        authUserId: socket.userId, // MongoDB User._id as string
      });

      // Send list of existing users to the new user
      const existingUsers = Array.from(rooms.get(roomId).entries())
        .filter(([uid]) => uid !== userId)
        .map(([uid, data]) => ({
          userId: uid,
          userName: data.userName,
          isHost: data.isHost,
          authUserId: data.authUserId,
        }));

      socket.emit('room-users', existingUsers);

      // Send existing chat history to the new user (if any)
      const existingChat = roomChats.get(roomId);
      if (existingChat && existingChat.length > 0) {
        socket.emit('meeting-chat-history', {
          roomId,
          messages: existingChat,
        });
      }

      // Send current host permissions state
      const perms = roomPermissions.get(roomId);
      if (perms) {
        socket.emit('host_permissions', {
          roomId,
          micLocked: !!perms.micLocked,
          cameraLocked: !!perms.cameraLocked,
          chatDisabled: !!perms.chatDisabled,
        });
      }

      // Notify others in room about new user
      socket.to(roomId).emit('user-joined', {
        userId,
        userName,
        isHost,
        authUserId: socket.userId,
      });

      console.log(`User ${userName} (${userId}) joined room ${roomId}`);

      // Host -> create/refresh MeetingControlSession mapping (native-only device)
      if (isHost) {
        (async () => {
          try {
            const hostUserId = socket.userId;
            if (!hostUserId || String(hostUserId).startsWith('guest-')) {
              throw new Error('Host must be authenticated');
            }

            const hostDevice = await Device.findOne({
              userId: String(hostUserId),
              deleted: false,
              blocked: false,
              deviceType: 'native-agent',
            }).sort({ lastOnline: -1 });

            if (!hostDevice) {
              throw new Error('Host native agent not online');
            }

            // Ensure old sessions are marked inactive
            await MeetingControlSession.updateMany(
              { meetingId: String(roomId), isActive: true },
              { $set: { isActive: false, updatedAt: new Date() } }
            );

            await MeetingControlSession.create({
              meetingId: String(roomId),
              hostUserId: hostUserId,
              hostDeviceId: String(hostDevice.deviceId),
              isActive: true,
              createdAt: new Date(),
              updatedAt: new Date(),
            });

            console.log('[MeetingControl] session created', {
              meetingId: String(roomId),
              hostUserId: String(hostUserId),
              hostDeviceId: String(hostDevice.deviceId),
            });
          } catch (err) {
            console.error('[MeetingControl] failed to create host mapping:', err && err.message);
          }
        })();
      }
    });

    // Participant requests control of meeting host device
    socket.on('request-control', async ({ meetingId }) => {
      try {
        const roomId = String(meetingId || socket.data.roomId || '');
        const requesterAuthUserId = socket.userId;

        console.log('[BACKEND] request-control received', { meetingId, roomId });
        console.log('[BACKEND] requester userId:', requesterAuthUserId);

        if (!roomId) {
          socket.emit('control-error', { message: 'meetingId is required' });
          return;
        }

        if (!requesterAuthUserId || String(requesterAuthUserId).startsWith('guest-')) {
          socket.emit('control-error', { message: 'Not authenticated' });
          return;
        }

        const session = await MeetingControlSession.findOne({
          meetingId: roomId,
          isActive: true,
        }).sort({ createdAt: -1 });
        if (!session) {
          socket.emit('control-error', { message: 'Host native agent not online' });
          return;
        }

        const hostUserId = String(session.hostUserId);
        const hostDeviceId = String(session.hostDeviceId);

        console.log('[BACKEND] Meeting found', session);
        console.log('[BACKEND] Emitting remote-access-request to hostDeviceId:', hostDeviceId);
        console.log('[BACKEND] Bridging meeting request-control to legacy AnyDesk modal event');

        // Emit to native agent device
        emitToDevice(hostDeviceId, 'remote-access-request', {
          sessionId: `meeting:${roomId}`,
          fromUserId: String(requesterAuthUserId),
          fromDeviceId: String(hostDeviceId),
          callerName: 'Meeting participant',
          meetingId: roomId,
          hostUserId,
          hostDeviceId,
          requestedByUserId: String(requesterAuthUserId),
        });

        // Emit to ALL host browser sockets
        const hostSockets = getUserSockets(hostUserId);
        if (hostSockets && hostSockets.size > 0) {
          console.log(`[BACKEND] Emitting to host user ${hostUserId} on ${hostSockets.size} sockets`);
          let successCount = 0;
          let failureCount = 0;

          hostSockets.forEach((socketId) => {
            const targetSocket = ioInstance.sockets.sockets.get(socketId);
            if (targetSocket) {
              targetSocket.emit('remote-access-request', {
                sessionId: `meeting:${roomId}`,
                fromUserId: String(requesterAuthUserId),
                fromDeviceId: String(hostDeviceId),
                callerName: 'Meeting participant',
                meetingId: roomId,
                hostUserId,
                hostDeviceId,
                requestedByUserId: String(requesterAuthUserId),
              });
              successCount++;
              console.log(`[BACKEND] Emitted to host socket ${socketId}`);
            } else {
              failureCount++;
              console.log(`[BACKEND] Failed to emit to host socket ${socketId} - socket not found`);
            }
          });

          console.log(`[BACKEND] Emit summary: ${successCount} success, ${failureCount} failures`);
        } else {
          console.log(`[BACKEND] No host sockets found for user ${hostUserId}`);
        }

        // Also emit to device (existing behavior preserved)
        emitToDevice(hostDeviceId, 'request-control', {
          meetingId: roomId,
          hostUserId,
          hostDeviceId,
          requestedByUserId: String(requesterAuthUserId),
        });

        emitToDevice(hostDeviceId, 'remote-access-request', {
          sessionId: `meeting:${roomId}`,
          fromUserId: String(requesterAuthUserId),
          fromDeviceId: String(hostDeviceId),
          callerName: 'Meeting participant',
          meetingId: roomId,
          hostUserId,
          hostDeviceId,
          requestedByUserId: String(requesterAuthUserId),
        });
      } catch (err) {
        console.error('[request-control] error:', err && err.message);
        socket.emit('control-error', { message: err.message || 'request-control failed' });
      }
    });

    // Send offer - target specific user
    socket.on('offer', ({ roomId, to, offer }) => {
      const roomUsers = rooms.get(roomId);
      if (!roomUsers) return;

      const targetUser = roomUsers.get(to);
      if (targetUser) {
        const targetSocket = io.sockets.sockets.get(targetUser.socketId);
        if (targetSocket) {
          targetSocket.emit('offer', {
            from: socket.data.userId,
            offer,
          });
        }
      }
    });

    // Send answer - target specific user
    socket.on('answer', ({ roomId, to, answer }) => {
      const roomUsers = rooms.get(roomId);
      if (!roomUsers) return;

      const targetUser = roomUsers.get(to);
      if (targetUser) {
        const targetSocket = io.sockets.sockets.get(targetUser.socketId);
        if (targetSocket) {
          targetSocket.emit('answer', {
            from: socket.data.userId,
            answer,
          });
        }
      }
    });

    // Send ICE candidate - target specific user
    socket.on('ice-candidate', ({ roomId, to, candidate }) => {
      const roomUsers = rooms.get(roomId);
      if (!roomUsers) return;

      const targetUser = roomUsers.get(to);
      if (targetUser) {
        const targetSocket = io.sockets.sockets.get(targetUser.socketId);
        if (targetSocket) {
          targetSocket.emit('ice-candidate', {
            from: socket.data.userId,
            candidate,
          });
        }
      }
    });

    // Screen share started
    socket.on('screen-share-started', ({ roomId, userId }) => {
      socket.to(roomId).emit('screen-share-started', {
        userId,
      });
      console.log(`Screen share started by ${userId} in room ${roomId}`);
    });

    // Screen share stopped
    socket.on('screen-share-stopped', ({ roomId, userId }) => {
      socket.to(roomId).emit('screen-share-stopped', {
        userId,
      });
      console.log(`Screen share stopped by ${userId} in room ${roomId}`);
    });

    // Audio mute
    socket.on('audio-mute', ({ roomId, userId }) => {
      socket.to(roomId).emit('audio-mute', {
        userId,
      });
    });

    // Audio unmute
    socket.on('audio-unmute', ({ roomId, userId }) => {
      const roomUsers = rooms.get(roomId);
      if (!roomUsers) return;

      const caller = roomUsers.get(socket.data.userId);
      const perms = roomPermissions.get(roomId) || {
        micLocked: false,
        cameraLocked: false,
        chatDisabled: false,
      };

      // If mic is locked and caller is not host, ignore unmute
      if (perms.micLocked && (!caller || !caller.isHost)) {
        console.log('[audio-unmute] blocked by host mic lock in room', roomId);
        return;
      }

      socket.to(roomId).emit('audio-unmute', {
        userId,
      });
    });

    // Video mute
    socket.on('video-mute', ({ roomId, userId }) => {
      socket.to(roomId).emit('video-mute', {
        userId,
      });
    });

    // Video unmute
    socket.on('video-unmute', ({ roomId, userId }) => {
      const roomUsers = rooms.get(roomId);
      if (!roomUsers) return;

      const caller = roomUsers.get(socket.data.userId);
      const perms = roomPermissions.get(roomId) || {
        micLocked: false,
        cameraLocked: false,
        chatDisabled: false,
      };

      // If camera is locked and caller is not host, ignore unmute
      if (perms.cameraLocked && (!caller || !caller.isHost)) {
        console.log('[video-unmute] blocked by host camera lock in room', roomId);
        return;
      }

      socket.to(roomId).emit('video-unmute', {
        userId,
      });
    });

    // In-meeting chat message (room broadcast + history)
    socket.on('meeting-chat-message', ({ roomId, userId, userName, text, ts }) => {
      try {
        if (!roomId || !text || !String(text).trim()) {
          return;
        }

        const perms = roomPermissions.get(roomId) || {
          micLocked: false,
          cameraLocked: false,
          chatDisabled: false,
        };

        const isHostSocket = !!socket.data.isHost;

        // If chat is disabled and this socket is not host, ignore message
        if (perms.chatDisabled && !isHostSocket) {
          console.log('[meeting-chat-message] blocked by host chat lock in room', roomId);
          return;
        }

        const senderId = userId || socket.data.userId;
        const senderName = userName || socket.data.userName || 'Participant';

        const message = {
          roomId,
          userId: senderId,
          userName: senderName,
          text: String(text).trim(),
          ts: ts || Date.now(),
        };

        if (!roomChats.has(roomId)) {
          roomChats.set(roomId, []);
        }
        const list = roomChats.get(roomId);
        list.push(message);
        // Optional cap to avoid unbounded growth
        if (list.length > 200) {
          list.splice(0, list.length - 200);
        }

        // Broadcast to everyone who joined this Socket.IO roomId
        io.to(roomId).emit('meeting-chat-message', message);
      } catch (err) {
        console.error('[socket] meeting-chat-message error', err && err.message);
      }
    });

    // Emoji reaction broadcast
    socket.on('reaction', ({ roomId, emoji, userId, userName, ts }) => {
      try {
        if (!roomId || !emoji) return;

        const senderId = userId || socket.data.userId;
        const senderName = userName || socket.data.userName || 'Participant';

        const payload = {
          roomId,
          userId: senderId,
          userName: senderName,
          emoji: String(emoji),
          ts: ts || Date.now(),
        };

        // Broadcast to everyone in the room (including sender)
        io.to(roomId).emit('reaction', payload);
      } catch (err) {
        console.error('[socket] reaction error', err && err.message);
      }
    });

    // Host: toggle mic lock (participants cannot unmute)
    socket.on('host_toggle_mic', ({ roomId, allowUnmute }) => {
      const roomUsers = rooms.get(roomId);
      if (!roomUsers) return;

      const caller = roomUsers.get(socket.data.userId);
      if (!caller || !caller.isHost) {
        console.warn('[host] non-host attempted mic toggle in room', roomId);
        return;
      }

      const perms = roomPermissions.get(roomId) || {
        micLocked: false,
        cameraLocked: false,
        chatDisabled: false,
      };

      const micLocked =
        allowUnmute != null ? !allowUnmute : !perms.micLocked;

      const updated = {
        ...perms,
        micLocked,
      };

      roomPermissions.set(roomId, updated);

      io.to(roomId).emit('host_toggle_mic', {
        roomId,
        micLocked,
        allowUnmute: !micLocked,
        changedBy: socket.data.userId,
        changedByName: caller.userName,
      });
    });

    // Host: toggle camera lock
    socket.on('host_toggle_camera', ({ roomId, allowCamera }) => {
      const roomUsers = rooms.get(roomId);
      if (!roomUsers) return;

      const caller = roomUsers.get(socket.data.userId);
      if (!caller || !caller.isHost) {
        console.warn('[host] non-host attempted camera toggle in room', roomId);
        return;
      }

      const perms = roomPermissions.get(roomId) || {
        micLocked: false,
        cameraLocked: false,
        chatDisabled: false,
      };

      const cameraLocked =
        allowCamera != null ? !allowCamera : !perms.cameraLocked;

      const updated = {
        ...perms,
        cameraLocked,
      };

      roomPermissions.set(roomId, updated);

      io.to(roomId).emit('host_toggle_camera', {
        roomId,
        cameraLocked,
        allowCamera: !cameraLocked,
        changedBy: socket.data.userId,
        changedByName: caller.userName,
      });
    });

    // Host: disable / enable chat for participants
    socket.on('host_disable_chat', ({ roomId, disabled }) => {
      const roomUsers = rooms.get(roomId);
      if (!roomUsers) return;

      const caller = roomUsers.get(socket.data.userId);
      if (!caller || !caller.isHost) {
        console.warn('[host] non-host attempted chat toggle in room', roomId);
        return;
      }

      const perms = roomPermissions.get(roomId) || {
        micLocked: false,
        cameraLocked: false,
        chatDisabled: false,
      };

      const chatDisabled =
        disabled != null ? !!disabled : !perms.chatDisabled;

      const updated = {
        ...perms,
        chatDisabled,
      };

      roomPermissions.set(roomId, updated);

      io.to(roomId).emit('host_disable_chat', {
        roomId,
        disabled: chatDisabled,
        changedBy: socket.data.userId,
        changedByName: caller.userName,
      });
    });

    // Host: mute all participants (except host)
    socket.on('host_mute_all', ({ roomId }) => {
      const roomUsers = rooms.get(roomId);
      if (!roomUsers) return;

      const caller = roomUsers.get(socket.data.userId);
      if (!caller || !caller.isHost) {
        console.warn('[host] non-host attempted mute-all in room', roomId);
        return;
      }

      const hostUserId = socket.data.userId;

      roomUsers.forEach((userData, uid) => {
        if (uid === hostUserId) return;

        const targetSocket = io.sockets.sockets.get(userData.socketId);
        if (targetSocket) {
          // Direct notice to the participant
          targetSocket.emit('host_mute_you', {
            roomId,
            hostId: hostUserId,
            hostName: caller.userName,
          });
        }

        // Let clients update UI for that userId
        io.to(roomId).emit('audio-mute', {
          userId: uid,
        });
      });
    });

    // Meeting Remote Access Control Events
    socket.on('request-access', ({ meetingId, targetUserId, requesterId }) => {
      try {
        const roomId = meetingId;
        const ownerId = String(targetUserId || '');
        const requesterAuthId = String(requesterId || getAuthUserIdForSocket(socket) || '');

        if (!roomId || !ownerId) {
          socket.emit('access-error', { meetingId: roomId || null, message: 'meetingId and targetUserId are required' });
          return;
        }
        if (!requesterAuthId) {
          socket.emit('access-error', { meetingId: roomId, message: 'Authentication required' });
          return;
        }
        if (!rooms.has(roomId)) {
          socket.emit('access-error', { meetingId: roomId, message: 'Room not found' });
          return;
        }
        if (!isAuthUserInRoom(roomId, requesterAuthId)) {
          socket.emit('access-error', { meetingId: roomId, message: 'Only meeting participants can request access' });
          return;
        }
        if (!isAuthUserInRoom(roomId, ownerId)) {
          socket.emit('access-error', { meetingId: roomId, message: 'Target user is not in this meeting' });
          return;
        }
        if (String(requesterAuthId) === String(ownerId)) {
          socket.emit('access-error', { meetingId: roomId, message: 'Cannot request access to your own PC' });
          return;
        }

        const state = getOrInitOwnerState(roomId, ownerId);

        if (state.activeController && String(state.activeController) === String(requesterAuthId)) {
          socket.emit('access-error', { meetingId: roomId, message: 'You are already controlling this PC' });
          return;
        }

        const alreadyPending = state.pendingRequests.some((r) => String(r.userId) === String(requesterAuthId));
        if (alreadyPending) {
          socket.emit('access-error', { meetingId: roomId, message: 'Request already pending' });
          return;
        }

        state.pendingRequests.push({ userId: String(requesterAuthId), requestedAt: Date.now() });

        console.log(`[Access Request] ${getDisplayName(roomId, requesterAuthId)} → ${getDisplayName(roomId, ownerId)} (Meeting: ${roomId})`);

        const ownerEntry = findMeetingUserByAuth(roomId, ownerId);
        if (ownerEntry) {
          const ownerSocket = io.sockets.sockets.get(ownerEntry.data.socketId);
          if (ownerSocket) {
            ownerSocket.emit('incoming-access-request', {
              meetingId: roomId,
              ownerId: String(ownerId),
              requesterId: String(requesterAuthId),
              requestedAt: Date.now(),
            });
          }
        }

        emitAccessState(roomId, ownerId);
      } catch (err) {
        console.error('[MeetingAccess] request-access error', err && err.message);
      }
    });

    socket.on('grant-access', ({ meetingId, ownerId, requesterId }) => {
      try {
        const roomId = meetingId;
        const ownerAuthId = String(ownerId || '');
        const controllerId = String(requesterId || '');

        if (!roomId || !ownerAuthId || !controllerId) {
          socket.emit('access-error', { meetingId: roomId || null, message: 'meetingId, ownerId, requesterId are required' });
          return;
        }

        const socketAuthId = getAuthUserIdForSocket(socket);
        if (!socketAuthId || String(socketAuthId) !== String(ownerAuthId)) {
          socket.emit('access-error', { meetingId: roomId, message: 'Only the owner can grant access' });
          return;
        }

        if (!isAuthUserInRoom(roomId, ownerAuthId) || !isAuthUserInRoom(roomId, controllerId)) {
          socket.emit('access-error', { meetingId: roomId, message: 'Owner/controller must be in meeting' });
          return;
        }

        const state = getOrInitOwnerState(roomId, ownerAuthId);

        // remove from pending
        state.pendingRequests = state.pendingRequests.filter((r) => String(r.userId) !== String(controllerId));

        const prev = state.activeController;
        if (prev && String(prev) !== String(controllerId)) {
          console.log(`[Access Switched] ${getDisplayName(roomId, prev)} → ${getDisplayName(roomId, controllerId)}`);

          const revokePayload = {
            meetingId: roomId,
            ownerId: String(ownerAuthId),
            revokedControllerId: String(prev),
            reason: 'switched',
          };

          io.to(roomId).emit('access-revoked', revokePayload);
          emitToUser(String(prev), 'access-revoked', revokePayload);
        }

        state.activeController = String(controllerId);

        console.log(`[Access Granted] ${getDisplayName(roomId, controllerId)} now controls ${getDisplayName(roomId, ownerAuthId)}`);

        const payload = {
          meetingId: roomId,
          ownerId: String(ownerAuthId),
          controllerId: String(controllerId),
        };
        io.to(roomId).emit('access-granted', payload);
        emitToUser(String(ownerAuthId), 'access-granted', payload);
        emitToUser(String(controllerId), 'access-granted', payload);
        emitAccessState(roomId, ownerAuthId);
      } catch (err) {
        console.error('[MeetingAccess] grant-access error', err && err.message);
      }
    });

    socket.on('reject-access', ({ meetingId, ownerId, requesterId }) => {
      try {
        const roomId = meetingId;
        const ownerAuthId = String(ownerId || '');
        const requesterAuthId = String(requesterId || '');

        if (!roomId || !ownerAuthId || !requesterAuthId) {
          socket.emit('access-error', { meetingId: roomId || null, message: 'meetingId, ownerId, requesterId are required' });
          return;
        }

        const socketAuthId = getAuthUserIdForSocket(socket);
        if (!socketAuthId || String(socketAuthId) !== String(ownerAuthId)) {
          socket.emit('access-error', { meetingId: roomId, message: 'Only the owner can reject access' });
          return;
        }

        const state = getOrInitOwnerState(roomId, ownerAuthId);
        state.pendingRequests = state.pendingRequests.filter((r) => String(r.userId) !== String(requesterAuthId));

        console.log(`[Access Rejected] ${getDisplayName(roomId, requesterAuthId)} rejected by ${getDisplayName(roomId, ownerAuthId)}`);

        const payload = {
          meetingId: roomId,
          ownerId: String(ownerAuthId),
          requesterId: String(requesterAuthId),
        };

        emitToUser(String(requesterAuthId), 'access-rejected', payload);
        io.to(roomId).emit('access-rejected', payload);
        emitAccessState(roomId, ownerAuthId);
      } catch (err) {
        console.error('[MeetingAccess] reject-access error', err && err.message);
      }
    });

    socket.on('revoke-access', ({ meetingId, ownerId }) => {
      try {
        const roomId = meetingId;
        const ownerAuthId = String(ownerId || '');

        if (!roomId || !ownerAuthId) {
          socket.emit('access-error', { meetingId: roomId || null, message: 'meetingId and ownerId are required' });
          return;
        }

        const socketAuthId = getAuthUserIdForSocket(socket);
        if (!socketAuthId || String(socketAuthId) !== String(ownerAuthId)) {
          socket.emit('access-error', { meetingId: roomId, message: 'Only the owner can revoke access' });
          return;
        }

        const state = getOrInitOwnerState(roomId, ownerAuthId);
        if (!state.activeController) {
          socket.emit('access-error', { meetingId: roomId, message: 'No active controller to revoke' });
          return;
        }

        const revoked = state.activeController;
        state.activeController = null;

        console.log(`[Access Revoked] ${getDisplayName(roomId, revoked)} removed`);

        const payload = {
          meetingId: roomId,
          ownerId: String(ownerAuthId),
          revokedControllerId: String(revoked),
        };
        io.to(roomId).emit('access-revoked', payload);
        emitToUser(String(ownerAuthId), 'access-revoked', payload);
        emitToUser(String(revoked), 'access-revoked', payload);
        emitAccessState(roomId, ownerAuthId);
      } catch (err) {
        console.error('[MeetingAccess] revoke-access error', err && err.message);
      }
    });
  });

  return io;
}

function getMetrics() {
  return { ...metrics };
}

module.exports = { createSocketServer, emitToUser, emitToDevice, getMetrics, isUserInMeeting };