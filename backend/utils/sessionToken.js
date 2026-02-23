const jwt = require('jsonwebtoken');
const crypto = require('crypto');

/**
 * New: Create session-scoped JWT used in signaling payloads
 */
function createSessionToken({ sessionId, callerDeviceId, receiverDeviceId, role }) {
  const secret = process.env.SESSION_SECRET || process.env.JWT_SECRET;
  if (!secret) throw new Error('SESSION_SECRET missing');
  return jwt.sign(
    {
      sessionId,
      callerDeviceId: String(callerDeviceId),
      receiverDeviceId: String(receiverDeviceId),
      role,
      type: 'desklink-session',
    },
    secret,
    { expiresIn: '10m' }
  );
}

/**
 * Generate ephemeral session token for older flows (kept for compatibility)
 * Short-lived (5 minutes default) and tied to specific session
 */
function generateSessionToken(sessionId, userId, deviceId, expiresInSeconds = 300) {
  const payload = {
    sessionId,
    userId: String(userId),
    deviceId: String(deviceId),
    type: 'webrtc-session',
    iat: Math.floor(Date.now() / 1000),
  };

  const secret = process.env.SESSION_SECRET || process.env.JWT_SECRET;
  return jwt.sign(payload, secret, {
    expiresIn: expiresInSeconds,
  });
}

/**
 * Verify session token (supports both token types)
 */
function verifySessionToken(token) {
  try {
    const secret = process.env.SESSION_SECRET || process.env.JWT_SECRET;
    const decoded = jwt.verify(token, secret);

    if (decoded.type !== 'webrtc-session' && decoded.type !== 'desklink-session') {
      console.warn('[sessionToken] invalid token type:', decoded.type);
      return null;
    }

    return decoded;
  } catch (err) {
    console.warn('[sessionToken] verify failed:', err.message);
    return null; // ❗ do NOT throw, just return null
  }
}

module.exports = {
  createSessionToken,
  generateSessionToken,
  verifySessionToken,
  generateTurnCredentials,
};


/**
 * Generate TURN credentials using HMAC (for coturn long-term credentials)
 */
function generateTurnCredentials(username, ttl = 86400) {
  const secret = process.env.TURN_SECRET;
  if (!secret) {
    return null;
  }

  const timestamp = Math.floor(Date.now() / 1000) + ttl;
  const turnUsername = `${timestamp}:${username}`;
  const hmac = crypto.createHmac('sha1', secret);
  hmac.update(turnUsername);
  const turnPassword = hmac.digest('base64');

  return {
    username: turnUsername,
    password: turnPassword,
    ttl: timestamp,
  };
}

module.exports = {
  generateSessionToken,
  verifySessionToken,
  generateTurnCredentials,
};