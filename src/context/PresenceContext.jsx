import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getSocket } from '../socket.js';

const PresenceContext = createContext();

export const usePresence = () => {
  const context = useContext(PresenceContext);
  if (!context) {
    throw new Error('usePresence must be used within a PresenceProvider');
  }
  return context;
};

export const PresenceProvider = ({ children, token }) => {
  const [onlineUsers, setOnlineUsers] = useState({});

  // Initialize socket and presence listeners
  useEffect(() => {
    if (!token) return;

    let active = true;

    const initializePresence = async () => {
      try {
        // Use the global socket manager instead of creating new socket
        const socketInstance = await getSocket(token);
        
        if (!active) return;

        // Listen for user online events
        const handleUserOnline = (data) => {
          console.log('[PRESENCE] User online:', data);
          setOnlineUsers(prev => ({
            ...prev,
            [data.phone]: true
          }));
        };

        // Listen for user offline events
        const handleUserOffline = (data) => {
          console.log('[PRESENCE] User offline:', data);
          setOnlineUsers(prev => {
            const { [data.phone]: removed, ...rest } = prev;
            return rest;
          });
        };

        // Register event listeners
        socketInstance.on('user-online', handleUserOnline);
        socketInstance.on('user-offline', handleUserOffline);

        // Cleanup function
        return () => {
          socketInstance.off('user-online');
          socketInstance.off('user-offline');
        };
      } catch (error) {
        console.error('[PRESENCE] Failed to initialize:', error);
      }
    };

    initializePresence();

    return () => {
      active = false;
      // Cleanup socket listeners when component unmounts
      try {
        const socketInstance = getSocket(token);
        if (socketInstance && typeof socketInstance.off === 'function') {
          socketInstance.off('user-online');
          socketInstance.off('user-offline');
        }
      } catch (error) {
        console.warn('[PRESENCE] Cleanup error:', error);
      }
    };
  }, [token]);

  // Register current user for presence tracking
  const registerUser = useCallback((userId, phone) => {
    const socketInstance = getSocket(token);
    if (socketInstance && userId && phone) {
      console.log('[PRESENCE] Registering user:', { userId, phone });
      socketInstance.emit('register-user', { userId, phone });
    }
  }, [token]);

  // Check if a user is online
  const isUserOnline = useCallback((phone) => {
    return !!onlineUsers[phone];
  }, [onlineUsers]);

  const value = {
    onlineUsers,
    isUserOnline,
    registerUser,
  };

  return (
    <PresenceContext.Provider value={value}>
      {children}
    </PresenceContext.Provider>
  );
};
