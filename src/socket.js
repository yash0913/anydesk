/**
 * GLOBAL SOCKET MANAGER
 * Single Socket.IO instance for the entire application
 * Prevents duplicate connections and ensures proper authentication
 */

import { io } from 'socket.io-client';

let globalSocket = null;
let connectionAttempts = 0;
const MAX_CONNECTION_ATTEMPTS = 3;

/**
 * Get or create the global socket instance
 * @param {string} token - JWT auth token
 * @returns {Promise<Socket>} Socket instance
 */
export function getSocket(token) {
  return new Promise((resolve, reject) => {
    // If socket already exists and is connected, return it
    if (globalSocket && globalSocket.connected) {
      console.log('[SOCKET] Reusing existing socket:', globalSocket.id);
      resolve(globalSocket);
      return;
    }

    // Prevent infinite connection attempts
    if (connectionAttempts >= MAX_CONNECTION_ATTEMPTS) {
      console.error('[SOCKET] Max connection attempts reached');
      reject(new Error('Max connection attempts'));
      return;
    }

    connectionAttempts++;
    console.log(`[SOCKET] Connection attempt ${connectionAttempts}/${MAX_CONNECTION_ATTEMPTS}`);

    // Create new socket with auth
    const socket = io(process.env.VITE_SOCKET_URL || 'https://anydesk.onrender.com', {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    // Connection event handlers
    socket.on('connect', () => {
      console.log(`[SOCKET] Connected with ID: ${socket.id}`);
      console.log(`[SOCKET] Authenticated as: ${socket.auth?.token ? 'YES' : 'NO'}`);
      globalSocket = socket;
      connectionAttempts = 0; // Reset on successful connection
      resolve(socket);
    });

    socket.on('connect_error', (err) => {
      console.error(`[SOCKET] Connection error:`, err);
      if (connectionAttempts >= MAX_CONNECTION_ATTEMPTS) {
        reject(err);
      }
    });

    socket.on('disconnect', (reason) => {
      console.log(`[SOCKET] Disconnected: ${reason}`);
      globalSocket = null;
    });

    // Set timeout for connection
    setTimeout(() => {
      if (!globalSocket || !globalSocket.connected) {
        console.error('[SOCKET] Connection timeout');
        reject(new Error('Connection timeout'));
      }
    }, 10000);
  });
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
