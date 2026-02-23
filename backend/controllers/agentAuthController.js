const jwt = require('jsonwebtoken');

// POST /api/agent/auth
// Body: { deviceId: string }
// Returns: { token: JWT } where payload includes { role: 'agent', deviceId }
module.exports.agentAuth = async (req, res) => {
  try {
    const { deviceId } = req.body || {};
    if (!deviceId || typeof deviceId !== 'string') {
      return res.status(400).json({ message: 'deviceId is required' });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error('[agentAuth] Missing JWT_SECRET');
      return res.status(500).json({ message: 'Server misconfiguration' });
    }

    const payload = {
      role: 'agent',
      deviceId,
    };

    const token = jwt.sign(payload, secret, { expiresIn: '7d' });
    return res.json({ token });
  } catch (err) {
    console.error('[agentAuth] error', err && err.message);
    return res.status(500).json({ message: 'Server error' });
  }
};
