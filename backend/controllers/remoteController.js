const mongoose = require('mongoose');

const RemoteSession = require('../models/RemoteSession');

const Device = require('../models/Device');

const ContactLink = require('../models/ContactLink');

const { emitToUser, emitToDevice, handleMeetingAccessTransfer } = require('../socketManager');

const { createSessionToken } = require('../utils/sessionToken');



// Ensure the calling device exists, belongs to the user, and is not blocked.

// If the device record does not exist yet, auto-register it for the user.

const ensureDeviceOwnership = async (deviceId, userId) => {

  const devId = String(deviceId);

  const ownerId = String(userId);



  let device = await Device.findOne({ deviceId: devId, deleted: false });



  if (!device) {

    device = await Device.create({

      deviceId: devId,

      userId: ownerId,

      deviceName: 'Agent Device',

      osInfo: 'Unknown',

      platform: '',

      lastOnline: new Date(),

      registeredAt: new Date(),

      blocked: false,

      deleted: false,

      label: 'Agent Device',

    });

  }



  if (String(device.userId) !== ownerId) {

    throw new Error('Device does not belong to user');

  }

  if (device.blocked) {

    throw new Error('Device is blocked');

  }

  return device;

};



/**

 * POST /api/remote/request

 * Creates a remote session request.

 */

// simple in-memory request throttle: Map<userId, timestamp>

const lastRequestAt = new Map();



// Generic DeskLink remote request (non-meeting flows).

// This endpoint preserves the legacy behavior: explicit fromUserId/fromDeviceId

// in the body, with strict ownership enforcement.

const requestRemoteSession = async (req, res) => {

  const { fromUserId, fromDeviceId, toUserId, toDeviceId } = req.body;



  if (!fromUserId || !fromDeviceId) {

    return res

      .status(400)

      .json({ message: 'fromUserId and fromDeviceId are required' });

  }



  if (!toUserId && !toDeviceId) {

    return res

      .status(400)

      .json({ message: 'Either toUserId or toDeviceId is required' });

  }



  if (String(req.user._id) !== String(fromUserId)) {

    return res

      .status(403)

      .json({ message: 'Forbidden: mismatched user context' });

  }



  try {

    const now = Date.now();

    const lastAt = lastRequestAt.get(String(fromUserId)) || 0;

    if (now - lastAt < 1000) {

      return res.status(429).json({ message: 'Too many requests' });

    }

    lastRequestAt.set(String(fromUserId), now);



    await ensureDeviceOwnership(fromDeviceId, fromUserId);



    let effectiveToUserId = toUserId;

    let receiverDevice;



    if (toDeviceId) {

      // 🔥 MANUAL DEVICE FLOW

      receiverDevice = await Device.findOne({

        deviceId: toDeviceId,

        deleted: false,

        blocked: false,

      });



      if (!receiverDevice) {

        return res

          .status(404)

          .json({ message: 'Receiver device not found or offline' });

      }



      if (!receiverDevice.userId) {

        // 👉 This is the case that was giving you "null"

        return res

          .status(400)

          .json({ message: 'Receiver device is not linked to any user' });

      }



      effectiveToUserId = String(receiverDevice.userId);

    } else {

      // 🔥 CONTACT / USER FLOW

      receiverDevice = await ContactLink.findOne({

        ownerUserId: fromUserId,

        contactUserId: toUserId,

        blocked: false,

      });



      if (receiverDevice) {

        receiverDevice = await Device.findOne({

          deviceId: receiverDevice.contactDeviceId,

          deleted: false,

          blocked: false,

        });

      } else {

        receiverDevice = await Device.findOne({

          userId: toUserId,

          deleted: false,

          blocked: false,

        }).sort({ lastOnline: -1 });

      }



      if (!receiverDevice) {

        return res

          .status(404)

          .json({ message: 'Receiver device not found or offline' });

      }

    }



    if (!effectiveToUserId) {

      return res.status(400).json({

        message:

          'receiverUserId could not be resolved (device/user mapping missing)',

      });

    }



    if (String(fromUserId) === String(effectiveToUserId)) {

      return res

        .status(400)

        .json({ message: 'Cannot start a session with yourself' });

    }



    const session = await RemoteSession.create({

      sessionId: new mongoose.Types.ObjectId().toString(),

      callerUserId: fromUserId,

      receiverUserId: effectiveToUserId,       // ✅ no longer "null"

      callerDeviceId: fromDeviceId,

      receiverDeviceId: receiverDevice.deviceId,

      status: 'pending',

      startedAt: new Date(),

    });



    const payload = {

      sessionId: session.sessionId,

      fromUserId,

      fromDeviceId,

      callerName: req.user.fullName,

      receiverDeviceId: session.receiverDeviceId,

    };



    emitToUser(effectiveToUserId, 'desklink-remote-request', payload);



    res.status(201).json({ session });

  } catch (error) {

    console.error('[requestRemoteSession] error', error);

    res.status(400).json({ message: error.message });

  }

};







/**

 * POST /api/remote/accept

 */

const acceptRemoteSession = async (req, res) => {

  const { sessionId, receiverDeviceId, permissions, selectedMonitor, resolution } = req.body;



  if (!sessionId) {

    return res.status(400).json({ message: 'sessionId is required' });

  }



  try {

    const session = await RemoteSession.findOne({ sessionId });

    if (!session) {

      return res.status(404).json({ message: 'Session not found' });

    }



    if (session.status !== 'pending') {

      return res.status(400).json({ message: 'Session is not pending' });

    }



    if (String(session.receiverUserId) !== String(req.user._id)) {

      return res.status(403).json({ message: 'Not authorized to accept this session' });

    }



    // 🔥 DO NOT overwrite receiverDeviceId from the browser's localDeviceId.

    // The host device was already chosen in requestRemoteSession (toDeviceId).

    // If you later want multi-device picking, you can handle it differently.

    if (!session.receiverDeviceId) {

      return res.status(400).json({ message: 'receiverDeviceId missing on session' });

    }



    // (Optional safety) ensure that existing receiverDeviceId belongs to this user

    await ensureDeviceOwnership(session.receiverDeviceId, req.user._id);



    // Generate session-scoped JWTs for both parties (caller/receiver)

    const callerToken = createSessionToken({

      sessionId: session.sessionId,

      callerDeviceId: session.callerDeviceId,

      receiverDeviceId: session.receiverDeviceId,

      role: 'caller',

    });

    const receiverToken = createSessionToken({

      sessionId: session.sessionId,

      callerDeviceId: session.callerDeviceId,

      receiverDeviceId: session.receiverDeviceId,

      role: 'receiver',

    });



    session.status = 'accepted';

    session.sessionToken = receiverToken;

    if (permissions) {

      session.permissions = { ...session.permissions, ...permissions };

    }

    if (selectedMonitor !== undefined) {

      session.selectedMonitor = selectedMonitor;

    }

    if (resolution) {

      session.resolution = resolution;

    }

    // If this session is from a meeting, handle switch/revocation

    if (session.fromMeeting) {

      console.log(`[API Accept] Meeting session switch for host ${session.receiverUserId}`);

      handleMeetingAccessTransfer(session.receiverUserId, session.callerUserId);

    }



    session.sessionToken = callerToken; // Use caller token as primary for DB for now



    await session.save();



    // Notify caller

    emitToUser(session.callerUserId, 'desklink-remote-response', {

      sessionId: session.sessionId,

      status: 'accepted',

      sessionToken: callerToken,

    });



    // Notify agent to start session

    emitToDevice(session.receiverDeviceId, 'desklink-session-start', {

      sessionId: session.sessionId,

      callerUserId: String(session.callerUserId),

      receiverUserId: String(session.receiverUserId),

      token: receiverToken,

      fromDeviceId: session.callerDeviceId,

      permissions: session.permissions,

      selectedMonitor: session.selectedMonitor,

      resolution: session.resolution,

    });



    // For meeting sessions, web user is caller (media source) and phone user is receiver (viewer)

    const isMeetingSession = session.fromMeeting === true;

    const callerPayload = {

      ...sessionMetadata,

      token: callerToken,

      role: 'caller',

    };



    console.log('[desklink-session-start emit]', {

      sessionId: session.sessionId,

      role: 'caller',

      hasToken: !!callerToken,

      tokenPreview: callerToken?.substring(0, 50),

      tokenLength: callerToken?.length,

      callerUserId: session.callerUserId,

      callerDeviceId: session.callerDeviceId

    });

    console.log('[desklink-session-start] Full caller payload:', JSON.stringify(callerPayload).substring(0, 200));

    const receiverPayload = {

      ...sessionMetadata,

      token: receiverToken,

      role: 'receiver',

    };

    console.log('[desklink-session-start emit]', {

      sessionId: session.sessionId,

      role: 'receiver',

      hasToken: !!receiverPayload.token,

      tokenPreview: receiverPayload.token?.substring(0, 50),

      tokenLength: receiverPayload.token?.length,

      receiverDeviceId: session.receiverDeviceId

    });

    console.log('[desklink-session-start] Full receiver payload:', JSON.stringify(receiverPayload).substring(0, 200));



    // Emit to web user (caller) - they create offer and send screen capture

    if (isMeetingSession) {

      console.log(`[Flow-Trace] Emitting session-start to Requester: ${session.callerUserId}`);

      emitToUser(session.callerUserId, 'desklink-session-start', callerPayload);

    } else {

      emitToDevice(session.receiverDeviceId, 'desklink-session-start', callerPayload);

    }

    // Emit to phone user (receiver) - they wait for offer and watch screen

    if (isMeetingSession) {

      console.log(`[Flow-Trace] Emitting session-start to Host: ${session.receiverUserId}`);

      emitToUser(session.receiverUserId, 'desklink-session-start', receiverPayload);

    } else {

      emitToDevice(session.receiverDeviceId, 'desklink-session-start', receiverPayload);

    }



    // Legacy / compatibility

    emitToUser(session.callerUserId, 'desklink-remote-response', {

      sessionId: session.sessionId,

      status: 'accepted',

      viewerDeviceId: session.callerDeviceId,

      hostDeviceId: session.receiverDeviceId,   // ✅ now always the agent device

      callerToken,

    });

    emitToUser(session.callerUserId, 'desklink-remote-accepted', {

      sessionId: session.sessionId,

      receiverDeviceId: session.receiverDeviceId,

    });



    res.json({ session, callerToken, receiverToken });

  } catch (error) {

    res.status(400).json({ message: error.message });

  }

};





/**

 * POST /api/remote/reject

 */

const rejectRemoteSession = async (req, res) => {

  const { sessionId } = req.body;



  if (!sessionId) {

    return res.status(400).json({ message: 'sessionId is required' });

  }



  try {

    const session = await RemoteSession.findOne({ sessionId });

    if (!session) {

      return res.status(404).json({ message: 'Session not found' });

    }



    if (session.status !== 'pending') {

      return res.status(400).json({ message: 'Session is not pending' });

    }



    if (String(session.receiverUserId) !== String(req.user._id)) {

      return res.status(403).json({ message: 'Not authorized to reject this session' });

    }



    session.status = 'rejected';

    session.endedAt = new Date();

    session.audit.push({

      event: 'rejected',

      userId: req.user._id,

      details: {},

    });

    await session.save();



    emitToUser(session.callerUserId, 'desklink-remote-response', {

      sessionId: session.sessionId,

      status: 'rejected',

    });

    emitToUser(session.callerUserId, 'desklink-remote-rejected', {

      sessionId: session.sessionId,

    });



    res.json({ session });

  } catch (error) {

    res.status(400).json({ message: error.message });

  }

};



/**

 * POST /api/remote/session/:id/complete

 */

const completeRemoteSession = async (req, res) => {

  const { id } = req.params;

  const sessionIdFromBody = req.body && req.body.sessionId;

  const sessionId = id || sessionIdFromBody;

  if (!sessionId) {

    return res.status(400).json({ message: 'sessionId is required' });

  }



  try {

    const session = await RemoteSession.findOne({ sessionId });

    if (!session) {

      return res.status(404).json({ message: 'Session not found' });

    }



    const userId = req.user._id;

    if (String(session.callerUserId) !== String(userId) && String(session.receiverUserId) !== String(userId)) {

      return res.status(403).json({ message: 'Not authorized to complete this session' });

    }



    session.status = 'ended';

    session.endedAt = new Date();

    session.audit.push({

      event: 'ended',

      userId: req.user._id,

      details: {},

    });

    await session.save();



    emitToUser(session.callerUserId, 'desklink-remote-response', {

      sessionId: session.sessionId,

      status: 'ended',

    });

    emitToUser(session.receiverUserId, 'desklink-remote-response', {

      sessionId: session.sessionId,

      status: 'ended',

    });

    emitToUser(session.callerUserId, 'desklink-session-ended', { sessionId: session.sessionId });

    emitToUser(session.receiverUserId, 'desklink-session-ended', { sessionId: session.sessionId });



    res.json({ session });

  } catch (error) {

    res.status(400).json({ message: error.message });

  }

};



// In-meeting remote access request (webId-only, background agent based).
const requestMeetingRemoteSession = async (req, res) => {

  const fromUserId = String(req.user && req.user._id);

  const { toUserId } = req.body || {};

  // ...


  if (!fromUserId) {

    return res.status(401).json({ message: 'Not authenticated' });

  }



  if (!toUserId) {

    return res.status(400).json({ message: 'toUserId is required' });

  }



  try {

    const now = Date.now();

    const lastAt = lastRequestAt.get(fromUserId) || 0;

    if (now - lastAt < 1000) {

      return res.status(429).json({ message: 'Too many requests' });

    }

    lastRequestAt.set(fromUserId, now);



    // Resolve active viewer device for this user (background agent)

    const viewerDevice = await Device.findOne({

      userId: fromUserId,

      deleted: false,

      blocked: false,

    }).sort({ lastOnline: -1 });



    if (!viewerDevice) {

      return res.status(404).json({ message: 'No active DeskLink agent running for this user' });

    }



    const fromDeviceId = viewerDevice.deviceId;



    let effectiveToUserId = toUserId;

    let receiverDevice;



    // Resolve receiver device by user/contact mapping (same as generic flow)

    receiverDevice = await ContactLink.findOne({

      ownerUserId: fromUserId,

      contactUserId: toUserId,

      blocked: false,

    });



    if (receiverDevice) {

      receiverDevice = await Device.findOne({

        deviceId: receiverDevice.contactDeviceId,

        deleted: false,

        blocked: false,

        deviceType: 'native-agent',

      });

    } else {

      receiverDevice = await Device.findOne({

        userId: toUserId,

        deleted: false,

        blocked: false,

        deviceType: 'native-agent',

      }).sort({ lastOnline: -1 });

    }



    if (!receiverDevice) {

      return res

        .status(404)

        .json({ message: 'No native agent online for this user' });

    }



    if (!effectiveToUserId) {

      return res.status(400).json({

        message:

          'receiverUserId could not be resolved (device/user mapping missing)',

      });

    }



    if (String(fromUserId) === String(effectiveToUserId)) {

      return res

        .status(400)

        .json({ message: 'Cannot start a session with yourself' });

    }



    const session = await RemoteSession.create({

      sessionId: new mongoose.Types.ObjectId().toString(),

      // IMPORTANT: receiverUserId must be the user who will see the incoming request modal
      // and click Accept (i.e. the target user). The accept endpoint authorizes by receiverUserId.
      // WebRTC roles are assigned later in acceptRemoteSession via payload.role and tokens.
      callerUserId: fromUserId,

      receiverUserId: effectiveToUserId,

      callerDeviceId: fromDeviceId,

      receiverDeviceId: receiverDevice.deviceId,

      status: 'pending',

      startedAt: new Date(),

      fromMeeting: true,  // ✅ Mark this as a meeting session

    });



    const payload = {

      sessionId: session.sessionId,

      fromUserId,

      fromDeviceId,

      callerName: req.user.fullName,

      receiverDeviceId: session.receiverDeviceId,

    };



    emitToUser(effectiveToUserId, 'desklink-remote-request', payload);



    res.status(201).json({ session });

  } catch (error) {

    console.error('[requestMeetingRemoteSession] error', error);

    res.status(400).json({ message: error.message });

  }

};



module.exports = {

  requestRemoteSession,

  requestMeetingRemoteSession,

  acceptRemoteSession,

  rejectRemoteSession,

  completeRemoteSession,

};





