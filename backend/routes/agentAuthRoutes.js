const express = require('express');
const router = express.Router();
const { agentAuth } = require('../controllers/agentAuthController');

// POST /api/agent/auth
router.post('/auth', agentAuth);

module.exports = router;
