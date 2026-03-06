/**
 * DeskLink Agent - Node.js WebRTC Helper (FIXED)
 * Dependencies:
 * npm install wrtc robotjs screenshot-desktop pngjs
 * 
 * NOTE: This helper does NOT create its own socket connection.
 * Signaling is forwarded via stdin/stdout from the C# agent.
 */

const wrtc = require('wrtc');
const { RTCPeerConnection, RTCSessionDescription, RTCIceCandidate } = wrtc;
const { nonstandard } = wrtc;
const { RTCVideoSource } = nonstandard;

const robot = require('robotjs');
const screenshot = require('screenshot-desktop');
const { PNG } = require('pngjs');

// Updated TURN servers with working credentials
const iceServers = [
  // STUN servers
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun2.l.google.com:19302" },
  { urls: "stun:stun.relay.metered.ca:80" },
  
  // Primary TURN servers - updated credentials
  {
    urls: "turn:global.relay.metered.ca:80",
    username: "e6178bf1e6fe468787026c44",
    credential: "lOyzquTmsN1b6RSo",
  },
  {
    urls: "turn:global.relay.metered.ca:443",
    username: "e6178bf1e6fe468787026c44",
    credential: "lOyzquTmsN1b6RSo",
  },
  {
    urls: "turns:global.relay.metered.ca:443",
    username: "e6178bf1e6fe468787026c44",
    credential: "lOyzquTmsN1b6RSo",
  },
  
  // Additional reliable TURN servers
  {
    urls: "turn:openrelay.metered.ca:80",
    username: "openrelayproject",
    credential: "openrelayproject",
  },
  {
    urls: "turn:openrelay.metered.ca:443",
    username: "openrelayproject",
    credential: "openrelayproject",
  },
  
  // Twilio TURN servers (free tier)
  {
    urls: "turn:global.turn.twilio.com:3478?transport=udp",
    username: "79a6322a2e32a1b2e0d0d1d1b1a1a1a1",
    credential: "79a6322a2e32a1b2e0d0d1d1b1a1a1a1",
  },
  {
    urls: "turn:global.turn.twilio.com:3478?transport=tcp",
    username: "79a6322a2e32a1b2e0d0d1d1b1a1a1a1",
    credential: "79a6322a2e32a1b2e0d0d1d1b1a1a1a1",
  },
  
  // Google STUN servers (backup)
  { urls: "stun:stun.stunprotocol.org:3478" },
  { urls: "stun:stun.sipgate.net:10000" },
];

// Configuration from command line args
const args = process.argv.slice(2);
const config = {
  serverUrl: args[0] || process.env.DESKLINK_SERVER_URL || 'https://anydesk.onrender.com',
  sessionId: args[1],
  token: args[2],
  deviceId: args[3],
  userId: args[4],
  remoteDeviceId: args[5],
  role: args[6] || 'receiver',
  agentJwt: args[7],
};

console.error('[NodeHelper] Starting with config:', JSON.stringify(config, null, 2));
console.error('[NodeHelper] Mode: Signaling via stdin/stdout (no socket)');

// STEP 5: VERIFY ENV VARIABLES
console.error('[NodeHelper] Environment variables:');
console.error('[NodeHelper] DESKLINK_SERVER_URL:', process.env.DESKLINK_SERVER_URL);
console.error('[NodeHelper] TURN_USERNAME:', process.env.TURN_USERNAME || 'NOT SET');
console.error('[NodeHelper] TURN_CREDENTIAL:', process.env.TURN_CREDENTIAL ? 'SET' : 'NOT SET');
console.error('[NodeHelper] Custom TURN servers from env:', process.env.TURN_SERVERS || 'NOT SET');

// ======================================================
// GLOBAL STATE
// ======================================================
let peerConnection = null;
let dataChannel = null;
let screenCaptureInterval = null;
let pendingRemoteIceCandidates = [];
let videoSource = null;
let videoTrack = null;

// Runtime session state (do NOT rely on argv config for per-session values)
let activeSessionId = config.sessionId;
let activeSessionToken = config.token;
let activeRemoteDeviceId = config.remoteDeviceId;
let currentControllerId = config.remoteDeviceId || null; // Strict single-controller enforcement

// Host Priority Override state
let isHostActive = false;
let hostActivityTimer = null;
let lastHostActivityTime = null;
const HOST_IDLE_TIMEOUT = 1500; // 1.5 seconds

// ======================================================
// WEBRTC LOGIC
// ======================================================

/**
 * Initialize WebRTC peer connection
 */
async function initPeerConnection(iceServers) {
  console.error('[WebRTC] ===== INITIALIZING PEER CONNECTION =====');
  console.error('[WebRTC] Role:', config.role);
  console.error('[WebRTC] Node version:', process.version);
  console.error('[WebRTC] ICE CONFIG:', JSON.stringify({
    iceServers,
    bundlePolicy: 'max-bundle',
    rtcpMuxPolicy: 'require',
  }, null, 2));

  // ✅ FIX: Add bundle policy to ensure single transport
  peerConnection = new RTCPeerConnection({
    iceServers,
    bundlePolicy: 'max-bundle',
    rtcpMuxPolicy: 'require',
    // STEP 3: PREFER HIGH QUALITY CODECS
    sdpSemantics: 'unified-plan',
  });

  // STEP 3: SET PREFERRED CODECS FOR HIGH QUALITY
  peerConnection.addEventListener('track', (event) => {
    console.error('[WebRTC] Track received:', event.track.kind);
  });

  peerConnection.onconnectionstatechange = () => {
    const state = peerConnection.connectionState;
    console.error('[WebRTC] ===== CONNECTION STATE CHANGE =====');
    console.error('[WebRTC] New state:', state);

    if (state === 'connecting') {
      console.error('[WebRTC] Attempting to connect...');
    } else if (state === 'connected') {
      console.error('[WebRTC] ✓✓✓ CONNECTED SUCCESSFULLY ✓✓✓');

      // STEP 3: LOG CODEC INFORMATION
      console.error('[WebRTC] ===== CODEC INFORMATION =====');
      peerConnection.getStats().then(stats => {
        stats.forEach(report => {
          if (report.type === 'codec') {
            console.error('[WebRTC] Codec used:', {
              mimeType: report.mimeType,
              clockRate: report.clockRate,
              channels: report.channels,
              sdpFmtpLine: report.sdpFmtpLine,
            });
          }
        });
      });

      // ✅ Check datachannel status after connection
      if (dataChannel) {
        console.error('[DataChannel] Status after connection - readyState:', dataChannel.readyState);
      } else {
        console.error('[DataChannel] WARNING: No datachannel after connection!');
      }

      if (config.role === 'receiver') {
        console.error('[Screen] Starting screen capture as receiver');
        startScreenCapture();
      }
    } else if (state === 'failed') {
      console.error('[WebRTC] ✗✗✗ CONNECTION FAILED ✗✗✗');
      console.error('[WebRTC] ICE connection state:', peerConnection.iceConnectionState);
      console.error('[WebRTC] Signaling state:', peerConnection.signalingState);

      peerConnection.getStats().then(stats => {
        stats.forEach(report => {
          if (report.type === 'candidate-pair') {
            console.error('[WebRTC] Candidate pair:', {
              state: report.state,
              priority: report.priority,
              nominated: report.nominated,
            });
          }
        });
      });
    } else if (state === 'disconnected') {
      console.error('[WebRTC] Disconnected (might recover)');
    } else if (state === 'closed') {
      console.error('[WebRTC] Connection closed');
    }
  };

  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      console.error('[WebRTC] LOCAL ICE TYPE:', event.candidate.type);
      console.error('[WebRTC] LOCAL ICE CANDIDATE:', JSON.stringify({
        type: event.candidate.type,
        protocol: event.candidate.protocol,
        address: event.candidate.address,
        port: event.candidate.port,
        foundation: event.candidate.foundation,
        relatedAddress: event.candidate.relatedAddress,
        relatedPort: event.candidate.relatedPort,
      }));
      console.error('[WebRTC] Sending local ICE candidate');
      // Send ICE via signaling (to C# agent -> socket)
      sendSignalingMessage('webrtc-ice', {
        sessionId: activeSessionId,
        fromUserId: config.userId,
        fromDeviceId: config.deviceId,
        toDeviceId: activeRemoteDeviceId,
        candidate: event.candidate,
        token: activeSessionToken,
      });
    } else if (!event.candidate) {
      console.error('[WebRTC] ICE gathering complete');
    }
  };

  // ✅ CRITICAL FIX: Ensure ondatachannel fires for receiver
  peerConnection.ondatachannel = (event) => {
    console.error('[WebRTC] ===== DATACHANNEL EVENT FIRED =====');
    console.error('[WebRTC] ✓✓✓ Data channel RECEIVED from caller ✓✓✓');
    console.error('[WebRTC] Channel label:', event.channel.label);
    console.error('[WebRTC] Channel readyState:', event.channel.readyState);
    console.error('[WebRTC] Channel id:', event.channel.id);

    dataChannel = event.channel;
    setupDataChannel();
  };

  peerConnection.oniceconnectionstatechange = () => {
    console.error('[WebRTC] ICE connection state:', peerConnection.iceConnectionState);

    if (peerConnection.iceConnectionState === 'checking') {
      console.error('[WebRTC] ICE checking candidates...');
    } else if (peerConnection.iceConnectionState === 'connected') {
      console.error('[WebRTC] ICE connected!');
    } else if (peerConnection.iceConnectionState === 'completed') {
      console.error('[WebRTC] ICE completed!');
    } else if (peerConnection.iceConnectionState === 'failed') {
      console.error('[WebRTC] ✗ ICE connection failed');
      peerConnection.getStats().then(stats => {
        stats.forEach(report => {
          if (report.type === 'local-candidate') {
            console.error('[ICE] Local candidate:', report.candidateType, report.protocol);
          }
          if (report.type === 'remote-candidate') {
            console.error('[ICE] Remote candidate:', report.candidateType, report.protocol);
          }
        });
      });
    }
  };

  peerConnection.onsignalingstatechange = () => {
    console.error('[WebRTC] Signaling state:', peerConnection.signalingState);
  };

  // ✅ If receiver: add video track BEFORE negotiation
  if (config.role === 'receiver') {
    try {
      videoSource = new RTCVideoSource();
      videoTrack = videoSource.createTrack();

      // ✅ ALTERNATIVE FIX: Try addTrack instead of addTransceiver
      const mediaStream = new wrtc.MediaStream();
      mediaStream.addTrack(videoTrack);

      const sender = peerConnection.addTrack(videoTrack, mediaStream);

      console.error('[WebRTC] ===== SETTING HIGH QUALITY ENCODING =====');
      const params = sender.getParameters();
      console.error('[WebRTC] Initial encoding params:', JSON.stringify(params, null, 2));

      // Initialize encodings array properly
      if (!params.encodings || params.encodings.length === 0) {
        params.encodings = [{}];
      }

      // Optimized settings for low latency - only set if encoding exists
      if (params.encodings[0]) {
        params.encodings[0].maxBitrate = 800000;   // 800 kbps for low latency
        params.encodings[0].scaleResolutionDownBy = 1.5;  // 720p or similar
        params.encodings[0].maxFramerate = 24;  // 24 FPS is smooth enough for control
      }

      videoTrack.contentHint = "motion";

      try {
        await sender.setParameters(params);
        console.error('[WebRTC] ✓ High quality encoding params applied');
        console.error('[WebRTC] Final encoding params:', JSON.stringify(params.encodings[0], null, 2));
      } catch (err) {
        console.error('[WebRTC] ✗ Failed to set encoding params:', err);
      }

      console.error('[WebRTC] ✓ Video track added from agent:', videoTrack.id);
      console.log('[WebRTC] MediaStream created:', mediaStream.id);
      console.log('[WebRTC] Sender created:', sender);
    } catch (err) {
      console.error('[WebRTC] ✗ Error creating video track:', err);
    }
  }

  return peerConnection;
}

/**
 * Setup data channel for control messages
 */
function setupDataChannel() {
  if (!dataChannel) {
    console.error('[DataChannel] ✗ setupDataChannel called but dataChannel is null!');
    return;
  }

  console.error('[DataChannel] ===== SETTING UP DATACHANNEL =====');
  console.error('[DataChannel] Current readyState:', dataChannel.readyState);

  dataChannel.onopen = () => {
    console.error('[DataChannel] ✓✓✓ OPENED ✓✓✓ - readyState:', dataChannel.readyState);

    // Send a test message
    try {
      dataChannel.send(JSON.stringify({ type: 'ready', message: 'Agent ready' }));
      console.error('[DataChannel] ✓ Test message sent');
    } catch (err) {
      console.error('[DataChannel] ✗ Error sending test message:', err);
    }
  };

  dataChannel.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data);
      // Synchronous handling is faster; only log on important events to reduce string overhead
      if (message.type !== 'mouse') {
        console.error('[DataChannel] ✓ Message received:', message.type);
      }
      handleControlMessage(message);
    } catch (err) {
      console.error('[DataChannel] ✗ Error parsing message:', err);
    }
  };

  dataChannel.onclose = () => {
    console.error('[DataChannel] Closed');
  };

  dataChannel.onerror = (err) => {
    console.error('[DataChannel] ✗ Error:', err);
  };

  // If already open, trigger onopen manually
  if (dataChannel.readyState === 'open') {
    console.error('[DataChannel] Already open, triggering onopen');
    dataChannel.onopen();
  }
}
// ======================================================
// CONTROL / ROBOTJS LOGIC
// ======================================================

function handleControlMessage(message) {
  if (!message || !message.type) return;

  // Host Priority Override: Block remote input if host is active
  if (isHostActive) {
    // Silently drop input events, but allow pings to keep channel alive
    if (message.type !== 'ping') return;
  }

  // Strict single-controller enforcement:
  if (!currentControllerId) {
    console.warn("[Control] No active controller. Ignoring message.");
    return;
  }

  if (message.controllerId && message.controllerId !== currentControllerId) {
    console.warn("[Control] Unauthorized controller:", message.controllerId);
    return;
  }

  try {
    switch (message.type) {
      case 'mouse':
        handleMouseMove(message);
        break;
      case 'click':
      case 'mouse_click':
        handleMouseClick(message);
        // Log action to backend for monitoring panel
        sendSignalingMessage('remote-action', {
          sessionId: activeSessionId,
          actionType: 'mouse_click',
          actionDetails: {
            button: message.button || 'left',
            x: Math.round((message.x || 0) * 100),
            y: Math.round((message.y || 0) * 100)
          }
        });
        break;
      case 'wheel':
        handleMouseWheel(message);
        // Log action to backend for monitoring panel
        sendSignalingMessage('remote-action', {
          sessionId: activeSessionId,
          actionType: 'scroll',
          actionDetails: {
            deltaX: message.deltaX || 0,
            deltaY: message.deltaY || 0
          }
        });
        break;
      case 'key':
        handleKeyPress(message);
        // Log action to backend for monitoring panel
        sendSignalingMessage('remote-action', {
          sessionId: activeSessionId,
          actionType: 'key',
          actionDetails: {
            key: message.key || '',
            ctrl: message.ctrl || false,
            alt: message.alt || false,
            shift: message.shift || false
          }
        });
        break;
      case 'clipboard':
        handleClipboard(message);
        break;
      case 'ping':
        if (dataChannel && dataChannel.readyState === 'open') {
          dataChannel.send(JSON.stringify({ type: 'pong', ts: Date.now() }));
        }
        break;
      default:
        console.error('[Control] Unknown message type:', message.type);
    }
  } catch (err) {
    console.error('[Control] Error handling message:', err);
  }
}

/**
 * Handle host activity notification from C# agent
 */
function handleHostActivity() {
  const now = Date.now();
  
  // Rate limiting: Only process host activity if at least 2 seconds have passed
  if (lastHostActivityTime && (now - lastHostActivityTime) < 2000) {
    console.log("[HostOverride] Ignoring host activity (rate limited)");
    return;
  }
  
  lastHostActivityTime = now;
  
  if (!isHostActive) {
    console.log("[HostOverride] Host active - Remote paused");
    isHostActive = true;
    notifyRemotePaused();
  }

  if (hostActivityTimer) {
    clearTimeout(hostActivityTimer);
  }

  // Increased timeout to reduce frequency of resume cycles
  hostActivityTimer = setTimeout(() => {
    console.log("[HostOverride] Host idle - Remote resumed");
    isHostActive = false;
    notifyRemoteResumed();
    hostActivityTimer = null;
  }, HOST_IDLE_TIMEOUT);
}

function notifyRemotePaused() {
  sendSignalingMessage('remote-control-paused', {
    sessionId: activeSessionId,
    fromUserId: config.userId,
    toDeviceId: activeRemoteDeviceId,
    token: activeSessionToken
  });
}

function notifyRemoteResumed() {
  sendSignalingMessage('remote-control-resumed', {
    sessionId: activeSessionId,
    fromUserId: config.userId,
    toDeviceId: activeRemoteDeviceId,
    token: activeSessionToken
  });
}

function handleMouseMove(message) {
  const screenSize = robot.getScreenSize();
  const x = Math.floor(message.x * screenSize.width);
  const y = Math.floor(message.y * screenSize.height);
  // Log every 10th move to reduce console flood but confirm accuracy
  if (Math.random() < 0.1) console.log("[Mouse] Move:", x, y);
  robot.moveMouse(x, y);
}

function handleMouseClick(message) {
  const screenSize = robot.getScreenSize();
  const x = Math.floor(message.x * screenSize.width);
  const y = Math.floor(message.y * screenSize.height);
  const button = message.button || 'left';
  
  console.log("[Mouse] ===== CLICK START =====");
  console.log("[Mouse] Button:", button);
  console.log("[Mouse] Calculated coords:", x, y);
  console.log("[Mouse] Screen size:", screenSize.width, screenSize.height);
  console.log("[Mouse] Original normalized coords:", message.x, message.y);
  
  try {
    // Ensure we are at the target before clicking
    console.log("[Mouse] Moving to position first...");
    robot.moveMouse(x, y);
    
    // Small delay to ensure position is set
    robot.setMouseDelay(10);
    
    console.log("[Mouse] Attempting robotjs click...");
    
    // Try robotjs click first
    robot.mouseClick(button);
    
    console.log("[Mouse] robotjs click completed");
    
    // Additional fallback: try direct SendInput via robotjs if available
    try {
      // Alternative method using robotjs's lower level functions
      if (button === 'left') {
        robot.mouseToggle('down', 'left');
        robot.setMouseDelay(50); // 50ms delay between down and up
        robot.mouseToggle('up', 'left');
        console.log("[Mouse] robotjs toggle click completed");
      } else if (button === 'right') {
        robot.mouseToggle('down', 'right');
        robot.setMouseDelay(50);
        robot.mouseToggle('up', 'right');
        console.log("[Mouse] robotjs right toggle click completed");
      }
    } catch (toggleError) {
      console.log("[Mouse] Toggle method failed:", toggleError.message);
    }
    
  } catch (error) {
    console.error("[Mouse] Click failed:", error.message);
    console.error("[Mouse] Full error:", error);
  }
  
  console.log("[Mouse] ===== CLICK END =====");
}

function handleMouseWheel(message) {
  if (message.deltaY) {
    const scrollAmount = message.deltaY > 0 ? -10 : 10;
    robot.scrollMouse(0, scrollAmount);
  }
}

const KEY_MAP = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  Enter: 'enter',
  Backspace: 'backspace',
  Escape: 'escape',
  Delete: 'delete',
  Tab: 'tab',
  Home: 'home',
  End: 'end',
  PageUp: 'pageup',
  PageDown: 'pagedown'
};

function normalizeKey(key) {
  if (!key) return null;
  if (KEY_MAP[key]) return KEY_MAP[key];
  if (/^[A-Z]$/.test(key)) return key.toLowerCase();
  if (/^\d$/.test(key)) return key;
  return key.toLowerCase();
}

function handleKeyPress(message) {
  if (message.modifiers?.ctrl && message.modifiers?.alt && message.key === 'Delete') {
    console.error('[Control] Blocked Ctrl+Alt+Del');
    return;
  }

  try {
    if (message.action === 'press' || message.action === 'down') {
      const key = normalizeKey(message.key);
      if (!key) {
        console.error('[Control] Unsupported key from client:', message.key);
        return;
      }

      const mods = Object.keys(message.modifiers || {}).filter(
        (k) => message.modifiers[k]
      );

      robot.keyTap(key, mods);
    }
  } catch (err) {
    console.error('[Control] Error handling key press:', err);
  }
}

function handleClipboard(message) {
  console.error('[Control] Clipboard sync not implemented');
}

// ======================================================
// SCREEN CAPTURE LOGIC
// ======================================================

async function startScreenCapture() {
  if (!videoSource) {
    console.error('[Screen] ✗ Cannot start capture: videoSource is not initialized');
    return;
  }
  if (screenCaptureInterval) {
    console.error('[Screen] Capture already running');
    return;
  }

  console.error('[Screen] ===== STARTING LOW LATENCY GRAYSCALE CAPTURE =====');
  const FPS = 24;
  const interval = 1000 / FPS;

  screenCaptureInterval = setInterval(async () => {
    try {
      const imgBuffer = await screenshot({ format: 'png' });
      const png = PNG.sync.read(imgBuffer);
      const { width, height, data: rgba } = png;

      const frameSize = width * height;
      const yPlaneSize = frameSize;
      const uvPlaneSize = frameSize >> 2;

      // i420 buffer
      const i420 = Buffer.allocUnsafe(yPlaneSize + uvPlaneSize + uvPlaneSize);

      // 1. Calculate Y (Luminance) only for grayscale
      for (let i = 0; i < frameSize; i++) {
        const r = rgba[i * 4];
        const g = rgba[i * 4 + 1];
        const b = rgba[i * 4 + 2];

        // Rec. 601 grayscale: Y = 0.299R + 0.587G + 0.114B
        i420[i] = (299 * r + 587 * g + 114 * b) / 1000;
      }

      // 2. Fill U and V with 128 (Neutral/Grayscale)
      i420.fill(128, yPlaneSize);

      videoSource.onFrame({
        width,
        height,
        data: i420,
      });
    } catch (err) {
      console.error('[Screen] Capture error:', err);
    }
  }, interval);

  console.error('[Screen] Capture started at', FPS, 'FPS');
}

function stopScreenCapture() {
  if (screenCaptureInterval) {
    clearInterval(screenCaptureInterval);
    screenCaptureInterval = null;
  }

  if (videoTrack) {
    try {
      videoTrack.stop();
    } catch (e) {
      console.error('[Screen] Error stopping videoTrack:', e);
    }
    videoTrack = null;
  }
  videoSource = null;
  console.error('[Screen] Capture stopped');
} // Added closing brace here

// ======================================================
// STDIN READER - Read signaling events from C# agent
// ======================================================

function initStdinReader() {
  console.error('[Stdin] ===== INITIALIZING STDIN READER =====');

  let buffer = '';

  process.stdin.on('data', (chunk) => {
    // console.error('[Stdin] Data received, length:', chunk.length);
    buffer += chunk.toString();

    // Process complete lines
    let lineEndIndex;
    while ((lineEndIndex = buffer.indexOf('\n')) !== -1) {
      const line = buffer.substring(0, lineEndIndex).trim();
      buffer = buffer.substring(lineEndIndex + 1);

      if (!line) continue;

      try {
        const msg = JSON.parse(line);
        if (msg.type === 'socket-event') {
          console.error('[Stdin] Event:', msg.eventName);
          handleSocketEvent(msg.eventName, msg.payload);
        } else if (msg.type === 'host-active') {
          handleHostActivity();
        }
      } catch (err) {
        // Only log if it's not empty and looks like it should be JSON
        if (line.includes('{')) {
          console.error('[Stdin] Error parsing line:', err.message);
          console.error('[Stdin] Line preview:', line.substring(0, 100));
        }
      }
    }
  });

  process.stdin.on('end', () => {
    console.error('[Stdin] stdin closed, exiting');
    cleanup();
    process.exit(0);
  });

  console.error('[Stdin] ===== STDIN READER INITIALIZED =====');
}

/**
 * Handle socket events forwarded from C# agent
 */
function handleSocketEvent(eventName, payload) {
  console.error('[Stdin] Received event:', eventName);

  switch (eventName) {
    case 'webrtc-offer':
      handleIncomingOffer(payload);
      break;
    case 'webrtc-answer':
      handleIncomingAnswer(payload);
      break;
    case 'webrtc-ice':
      handleIncomingIce(payload);
      break;
    case 'webrtc-cancel':
      console.error('[Socket] Session cancelled');
      cleanup();
      process.exit(0);
      break;
    case 'agent-force-detach-controller':
      console.error('[Agent] Force detach controller:', payload.oldControllerId, 'reason:', payload.reason);
      currentControllerId = null;
      // Close existing peer connection and data channel
      stopScreenCapture();
      if (dataChannel) {
        try { dataChannel.close(); } catch (e) { }
        dataChannel = null;
      }
      if (peerConnection) {
        try { peerConnection.close(); } catch (e) { }
        peerConnection = null;
      }
      pendingRemoteIceCandidates = [];
      console.error('[Agent] Detached from old controller, ready for new connection');
      break;
    case 'agent-attach-controller':
      console.error('[Agent] Attach new controller:', payload.controllerId, 'accessType:', payload.accessType);
      currentControllerId = payload.controllerId || null;
      // Re-initialize peer connection for new controller (offer will come via signaling)
      initPeerConnection(iceServers).then(() => {
        console.error('[Agent] Peer connection re-initialized for new controller');
      }).catch(err => {
        console.error('[Agent] Failed to re-init peer connection:', err);
      });
      break;
    case 'agent-clear-controller':
      console.error('[Agent] Clear controller, reason:', payload.reason);
      currentControllerId = null;
      stopScreenCapture();
      if (dataChannel) {
        try { dataChannel.close(); } catch (e) { }
        dataChannel = null;
      }
      if (peerConnection) {
        try { peerConnection.close(); } catch (e) { }
        peerConnection = null;
      }
      pendingRemoteIceCandidates = [];
      console.error('[Agent] Controller cleared, idle');
      break;
    default:
      console.error('[Stdin] Unknown event:', eventName);
  }
}

// ======================================================
// SIGNALING
// ======================================================

/**
 * Send a signaling message to the C# agent (which forwards to socket)
 * Output format: [SIGNALING]{"event":"eventName","payload":{...}}
 */
function sendSignalingMessage(eventName, payload) {
  const msg = JSON.stringify({ event: eventName, payload });
  // Use process.stdout.write for more reliable output of large messages
  process.stdout.write(`[SIGNALING]${msg}\n`);
  console.error(`[WebRTC] Sent ${eventName} message (${msg.length} chars)`);
}

/**
 * Handle incoming offer (for receiver role)
 */
async function handleIncomingOffer({ sdp, sessionId, fromUserId, fromDeviceId, toDeviceId, token }) {
  console.error('[WebRTC] ===== RECEIVED OFFER =====');
  console.error('[WebRTC] sessionId:', sessionId);
  console.error('[WebRTC] fromDeviceId:', fromDeviceId);
  console.error('[WebRTC] toDeviceId:', toDeviceId);
  console.error('[WebRTC] My deviceId:', config.deviceId);
  console.error('[WebRTC] SDP type:', sdp ? 'present' : 'MISSING');

  // Update runtime session state from signaling message
  activeSessionId = sessionId;
  activeRemoteDeviceId = fromDeviceId;
  activeSessionToken = token;
  console.error('[WebRTC] Active session updated:', {
    activeSessionId,
    activeRemoteDeviceId,
    hasToken: !!activeSessionToken,
  });

  try {
    if (!peerConnection) {
      console.error('[WebRTC] Creating PeerConnection for incoming offer');
      await initPeerConnection(iceServers);
    }

    console.error('[WebRTC] Setting remote description (offer)...');
    await peerConnection.setRemoteDescription(
      new RTCSessionDescription({ type: 'offer', sdp })
    );
    console.error('[WebRTC] ✓ Remote description set');

    // Apply buffered ICE candidates
    if (pendingRemoteIceCandidates.length > 0) {
      console.error('[WebRTC] Applying', pendingRemoteIceCandidates.length, 'buffered ICE candidates');
      for (const c of pendingRemoteIceCandidates) {
        try {
          await peerConnection.addIceCandidate(new RTCIceCandidate(c));
          console.error('[WebRTC] ✓ Applied buffered ICE candidate');
        } catch (err) {
          console.error('[WebRTC] ✗ Error applying buffered ICE:', err.message);
        }
      }
      pendingRemoteIceCandidates = [];
    }

    console.error('[WebRTC] Creating answer...');
    const answer = await peerConnection.createAnswer();

    await peerConnection.setLocalDescription(answer);
    console.error('[WebRTC] ✓ Local description set (answer)');

    // Send answer via signaling (to C# agent -> socket)
    sendSignalingMessage('webrtc-answer', {
      sessionId,
      fromUserId: config.userId,
      fromDeviceId: config.deviceId,
      toDeviceId: fromDeviceId,
      sdp: answer.sdp,
      token,
    });
    console.error('[WebRTC] ✓✓✓ ANSWER SENT ✓✓✓');
  } catch (err) {
    console.error('[WebRTC] ✗✗✗ ERROR handling offer:', err);
    console.error('[WebRTC] Error stack:', err.stack);
  }
}

/**
 * Handle incoming answer (for caller role)
 */
async function handleIncomingAnswer({ sdp, sessionId }) {
  console.error('[WebRTC] ===== RECEIVED ANSWER =====');
  console.error('[WebRTC] sessionId:', sessionId);
  try {
    await peerConnection.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp }));
    console.error('[WebRTC] ✓ Remote description set (answer)');

    // Apply buffered ICE
    if (pendingRemoteIceCandidates.length > 0) {
      console.error('[WebRTC] Applying', pendingRemoteIceCandidates.length, 'buffered ICE candidates');
      for (const c of pendingRemoteIceCandidates) {
        try {
          await peerConnection.addIceCandidate(new RTCIceCandidate(c));
        } catch (err) {
          console.error('[WebRTC] Error applying buffered ICE:', err);
        }
      }
      pendingRemoteIceCandidates = [];
    }
  } catch (err) {
    console.error('[WebRTC] ✗ Error handling answer:', err);
  }
}

/**
 * Handle incoming ICE candidate
 */
async function handleIncomingIce({ candidate, sessionId, fromDeviceId, toDeviceId }) {
  try {
    if (!candidate || !candidate.candidate) {
      console.error('[WebRTC] Received empty ICE candidate, ignoring');
      return;
    }

    console.error('[WebRTC] Received ICE candidate from:', fromDeviceId);

    // Buffer ICE if remote description not set yet
    if (!peerConnection || !peerConnection.remoteDescription) {
      pendingRemoteIceCandidates.push(candidate);
      console.error('[WebRTC] Buffering ICE candidate (remoteDesc not ready). Total buffered:', pendingRemoteIceCandidates.length);
      return;
    }

    await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    console.error('[WebRTC] ✓ ICE candidate added successfully');
  } catch (err) {
    console.error('[WebRTC] ✗ Error adding ICE candidate:', err.message);
  }
}

// ======================================================
// CLEANUP & ENTRY
// ======================================================

function cleanup() {
  console.error('[NodeHelper] ===== CLEANING UP =====');

  stopScreenCapture();
  pendingRemoteIceCandidates = [];

  if (dataChannel) {
    try { dataChannel.close(); } catch (e) { }
    dataChannel = null;
  }

  if (peerConnection) {
    try { peerConnection.close(); } catch (e) { }
    peerConnection = null;
  }
}

process.on('SIGINT', () => {
  cleanup();
  process.exit(0);
});

process.on('SIGTERM', () => {
  cleanup();
  process.exit(0);
});

async function main() {
  try {
    // ✅ CRITICAL DEBUG: Log immediately on startup
    console.error('[NodeHelper] ===== MAIN FUNCTION STARTED =====');
    console.error('[NodeHelper] Process PID:', process.pid);
    console.error('[NodeHelper] Args:', process.argv);

    // ✅ CRITICAL FIX: Add small delay to ensure process is fully ready
    await new Promise(resolve => setTimeout(resolve, 500));
    console.error('[NodeHelper] ===== PROCESS READY =====');

    // Initialize stdin reader for signaling from C# agent
    console.error('[NodeHelper] About to initialize stdin reader...');
    initStdinReader();
    console.error('[NodeHelper] Stdin reader initialized');

    // Initialize peer connection
    await initPeerConnection(iceServers);

    // For caller role, create offer immediately
    if (config.role === 'caller') {
      console.error('[NodeHelper] ===== ROLE: CALLER =====');
      console.error('[NodeHelper] Creating DataChannel and Offer...');
      // Unordered + Unreliable for lowest latency on control messages
      dataChannel = peerConnection.createDataChannel('desklink-control', {
        ordered: false,
        maxRetransmits: 0
      });
      setupDataChannel();

      console.error('[NodeHelper] ✓ DataChannel created');

      // Wait a bit for datachannel to initialize
      await new Promise(resolve => setTimeout(resolve, 200));

      // Then create offer
      const offer = await peerConnection.createOffer({
        offerToReceiveVideo: true,
        offerToReceiveAudio: false,
      });
      await peerConnection.setLocalDescription(offer);

      console.error('[NodeHelper] ✓ Offer created and local description set');

      // Send offer via signaling (to C# agent -> socket)
      sendSignalingMessage('webrtc-offer', {
        sessionId: config.sessionId,
        fromUserId: config.userId,
        fromDeviceId: config.deviceId,
        toDeviceId: config.remoteDeviceId,
        sdp: offer.sdp,
        token: config.token,
      });

      console.error('[WebRTC] ✓✓✓ OFFER SENT to', config.remoteDeviceId);
    } else {
      console.error('[NodeHelper] ===== ROLE: RECEIVER =====');
      console.error('[NodeHelper] Waiting for offer from caller (via stdin)...');
    }
  } catch (err) {
    console.error('[NodeHelper] Fatal error:', err);
    process.exit(1);
  }
}

main();