// server.js

const express = require('express');
const http = require('http');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const contactsRoutes = require('./routes/contactsRoutes');
const messagingRoutes = require('./routes/messagingRoutes');
const deviceRoutes = require('./routes/deviceRoutes');
const contactLinkRoutes = require('./routes/contactLinkRoutes');
const remoteRoutes = require('./routes/remoteRoutes');
const agentProvisionRoutes = require('./routes/agentProvisionRoutes');
const agentAuthRoutes = require('./routes/agentAuthRoutes');
const { createSocketServer } = require('./socketManager');

// Load environment variables
dotenv.config();

// Connect to the database
connectDB();

// Initialize Express app
const app = express();

const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

// Open CORS to all origins — required for dynamic Cloudflare tunnel URLs
const corsOptions = {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'x-device-id', 'x-user-id', 'x-user-name'],
};

// Middleware
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/contacts', contactsRoutes);
app.use('/api/messages', messagingRoutes);
app.use('/api/device', deviceRoutes);
app.use('/api/contact-links', contactLinkRoutes);
app.use('/api/agent', agentProvisionRoutes);
app.use('/api/agent', agentAuthRoutes);
// Note: remoteRoutes is mounted later to allow desklink module to register its overrides first if needed

// Create HTTP server and attach Socket.IO
const server = http.createServer(app);
const io = createSocketServer(server, CLIENT_ORIGIN);

// Initialize DeskLink Module (In-memory meeting logic)
// This must come before remoteRoutes if we want it to handle specific paths like /meeting-request
const initDesklink = require('./desklink-server');
initDesklink(app, server, io);

// Mount remote routes (DB-backed fallbacks and TURN token)
app.use('/api/remote', remoteRoutes);

// Metrics endpoint for observability
app.get('/metrics', (req, res) => {
  const { getMetrics } = require('./socketManager');
  const metrics = getMetrics ? getMetrics() : {};

  // Prometheus-style text format
  const lines = [
    '# HELP desklink_active_sessions Number of active remote sessions',
    '# TYPE desklink_active_sessions gauge',
    `desklink_active_sessions ${metrics.activeSessions || 0}`,
    '',
    '# HELP desklink_offers_relayed_total Total WebRTC offers relayed',
    '# TYPE desklink_offers_relayed_total counter',
    `desklink_offers_relayed_total ${metrics.offersRelayed || 0}`,
    '',
    '# HELP desklink_ice_failures_total Total ICE candidate failures',
    '# TYPE desklink_ice_failures_total counter',
    `desklink_ice_failures_total ${metrics.iceFailures || 0}`,
    '',
    '# HELP desklink_datachannel_msgs_total Total datachannel messages',
    '# TYPE desklink_datachannel_msgs_total counter',
    `desklink_datachannel_msgs_total ${metrics.datachannelMsgs || 0}`,
  ];

  res.set('Content-Type', 'text/plain; version=0.0.4');
  res.send(lines.join('\n'));
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Define the port
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
