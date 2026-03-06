import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getSocket } from '../../socket.js';

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
  const [socket, setSocket] = useState(null);

  // Initialize socket and presence listeners
  useEffect(() => {
    if (!token) return;

    let active = true;
    let socketInstance = null;

    const initializePresence = async () => {
      try {
        socketInstance = await getSocket(token);
        if (!active) return;

        setSocket(socketInstance);

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
          setOnlineUsers(prev => ({
            ...prev,
            [data.phone]: false
          }));
        };

        // Register event listeners
        socketInstance.on('user-online', handleUserOnline);
        socketInstance.on('user-offline', handleUserOffline);

        // Cleanup function
        return () => {
          if (socketInstance) {
            socketInstance.off('user-online', handleUserOnline);
            socketInstance.off('user-offline', handleUserOffline);
          }
        };
      } catch (error) {
        console.error('[PRESENCE] Failed to initialize:', error);
      }
    };

    initializePresence();

    return () => {
      active = false;
    };
  }, [token]);

  // Register current user for presence tracking
  const registerUser = useCallback((userId, phone) => {
    if (socket && userId && phone) {
      console.log('[PRESENCE] Registering user:', { userId, phone });
      socket.emit('register-user', { userId, phone });
    }
  }, [socket]);

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
