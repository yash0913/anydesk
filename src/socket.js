/**
 * GLOBAL SOCKET MANAGER
 * Single Socket.IO instance for the entire application
 * Prevents duplicate connections and ensures proper authentication
 */

import { io } from 'socket.io-client';

let globalSocket = null;
let currentToken = null;
let connectionAttempts = 0;
let pendingConnectPromise = null;
let webDeviceRegistered = false; // Prevent duplicate registrations
const MAX_CONNECTION_ATTEMPTS = 5; // Increased slightly for better reliability

export function getSocket(token) {
  // If token changed, disconnect old socket
  if (globalSocket && currentToken && currentToken !== token) {
    console.log('[SOCKET] Token changed, disconnecting old socket');
    disconnectSocket();
  }

  // If socket already exists and is connected, return it
  if (globalSocket && globalSocket.connected) {
    console.log('[SOCKET] Reusing existing connected socket:', globalSocket.id);
    return Promise.resolve(globalSocket);
  }

  currentToken = token;

  // If there's already a connection attempt in progress, return that same promise
  if (pendingConnectPromise) {
    console.log('[SOCKET] Joining existing connection attempt');
    return pendingConnectPromise;
  }

  // Prevent infinite connection attempts if we're truly stuck
  if (connectionAttempts >= MAX_CONNECTION_ATTEMPTS) {
    console.error('[SOCKET] Max connection attempts reached. Resetting counter to allow fresh manual trigger.');
    // We reset the counter here so that a SUBSEQUENT call (likely after a user action or token change) can try again.
    // This fixed the "permanent lockout" bug.
    connectionAttempts = 0;
  }

  pendingConnectPromise = new Promise((resolve, reject) => {
    connectionAttempts++;
    console.log(`[SOCKET] Connection attempt ${connectionAttempts}/${MAX_CONNECTION_ATTEMPTS}`);

    // Create new socket with auth
    const SOCKET_BASE = import.meta.env.VITE_SOCKET_URL || 'https://anydesk.onrender.com';

    console.log('[SOCKET] Connecting to:', SOCKET_BASE);

    const socket = io(SOCKET_BASE, {
      auth: { token },
      transports: ['websocket'],
      reconnectionAttempts: 3,
      timeout: 10000,
    });

    // Connection event handlers
    socket.on('connect', () => {
      console.log(`[SOCKET-DIAG] socket.connect fires with ID: ${socket.id}`);
      console.log(`[SOCKET-DIAG] Authenticated as: ${socket.auth?.token ? 'YES' : 'NO'}`);
      globalSocket = socket;
      connectionAttempts = 0; // Reset on successful connection
      pendingConnectPromise = null;

      // Register web client device for signaling routing (only once)
      if (socket.auth?.token && !webDeviceRegistered) {
        try {
          // Extract user ID from JWT token (simple approach)
          const tokenParts = socket.auth.token.split('.');
          if (tokenParts.length === 3) {
            const payload = JSON.parse(atob(tokenParts[1]));
            const userId = payload.id;

            if (userId) {
              const webDeviceId = `web-${userId}`;
              socket.emit('register-device', {
                deviceId: webDeviceId,
                userId: userId,
                type: 'web'
              });
              console.log(`[SOCKET] Registered web device: ${webDeviceId}`);
              webDeviceRegistered = true;
            }
          }
        } catch (err) {
          console.warn('[SOCKET] Failed to register web device:', err.message);
        }
      }

      resolve(socket);
    });

    socket.on('connect_error', (err) => {
      console.error(`[SOCKET-DIAG] socket.connect_error fires:`, err.message);

      // Don't reject immediately on first connect_error if Socket.IO is still retrying internally
      // But if we've hit our own wrapping limit, fail the promise
      if (connectionAttempts >= MAX_CONNECTION_ATTEMPTS) {
        pendingConnectPromise = null;
        reject(err);
      }
    });

    socket.on('disconnect', (reason) => {
      console.log(`[SOCKET] Disconnected: ${reason}`);
      globalSocket = null;
      pendingConnectPromise = null;
      webDeviceRegistered = false; // Reset flag for next connection
    });

    // Set fallback timeout for the promise itself
    setTimeout(() => {
      if (pendingConnectPromise && (!globalSocket || !globalSocket.connected)) {
        console.error('[SOCKET] Connection timeout inside getSocket wrapper');
        pendingConnectPromise = null;
        reject(new Error('Connection timeout'));
      }
    }, 15000);
  });

  return pendingConnectPromise;
}

/**
 * Get the current global socket instance
 * @returns {Socket|null} Current socket or null
 */
export function getCurrentSocket() {
  return globalSocket;
}

/**
 * Disconnect the global socket
 */
export function disconnectSocket() {
  if (globalSocket) {
    console.log(`[SOCKET] Manually disconnecting: ${globalSocket.id}`);
    globalSocket.disconnect();
    globalSocket = null;
  }
}
